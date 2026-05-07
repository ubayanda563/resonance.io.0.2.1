from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
import logging
import random

from database import get_database

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("/similar/{track_id}", response_model=List[dict])
async def get_similar_tracks(
    track_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    limit: int = Query(10, ge=1, le=50)
):
    """Get tracks similar to the given track"""
    try:
        # Get the reference track
        track = await db.tracks.find_one({"_id": ObjectId(track_id)})
        if not track:
            raise HTTPException(status_code=404, detail="Track not found")
        
        # Find tracks by same artist
        artist_tracks = await db.tracks.find({
            "_id": {"$ne": ObjectId(track_id)},
            "artist": track.get("artist")
        }).limit(limit).to_list(None)
        
        if len(artist_tracks) >= limit:
            return artist_tracks
        
        # If not enough by artist, add random popular tracks
        all_tracks = await db.tracks.find({
            "_id": {"$ne": ObjectId(track_id)}
        }).sort("play_count", -1).limit(limit * 2).to_list(None)
        
        similar = artist_tracks + [t for t in all_tracks if t not in artist_tracks]
        return similar[:limit]
    except Exception as e:
        logger.error(f"Error getting similar tracks: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get similar tracks")


@router.get("/artist/{artist}", response_model=List[dict])
async def get_artist_discography(
    artist: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    limit: int = Query(20, ge=1, le=100)
):
    """Get all tracks by a specific artist"""
    try:
        tracks = await db.tracks.find(
            {"artist": {"$regex": artist, "$options": "i"}}
        ).sort("upload_date", -1).limit(limit).to_list(None)
        return tracks
    except Exception as e:
        logger.error(f"Error getting artist discography: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get artist discography")


@router.get("/trending", response_model=List[dict])
async def get_trending_tracks(
    db: AsyncIOMotorDatabase = Depends(get_database),
    limit: int = Query(20, ge=1, le=100)
):
    """Get trending tracks based on play count"""
    try:
        tracks = await db.tracks.find().sort("play_count", -1).limit(limit).to_list(None)
        return tracks
    except Exception as e:
        logger.error(f"Error getting trending tracks: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get trending tracks")


@router.get("/fresh", response_model=List[dict])
async def get_fresh_tracks(
    db: AsyncIOMotorDatabase = Depends(get_database),
    days: int = Query(7, ge=1, le=90),
    limit: int = Query(20, ge=1, le=100)
):
    """Get recently uploaded/added tracks"""
    try:
        from datetime import timedelta
        start_date = datetime.utcnow() - timedelta(days=days)
        
        tracks = await db.tracks.find(
            {"upload_date": {"$gte": start_date}}
        ).sort("upload_date", -1).limit(limit).to_list(None)
        return tracks
    except Exception as e:
        logger.error(f"Error getting fresh tracks: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get fresh tracks")


@router.get("/genres/{genre}", response_model=List[dict])
async def get_genre_tracks(
    genre: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    limit: int = Query(20, ge=1, le=100)
):
    """Get tracks by genre (based on metadata if available)"""
    try:
        tracks = await db.tracks.find(
            {"album": {"$regex": genre, "$options": "i"}}
        ).sort("upload_date", -1).limit(limit).to_list(None)
        
        if len(tracks) < limit:
            # If not found in album, return popular tracks as fallback
            popular = await db.tracks.find().sort("play_count", -1).limit(limit).to_list(None)
            return popular
        
        return tracks
    except Exception as e:
        logger.error(f"Error getting genre tracks: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get genre tracks")
