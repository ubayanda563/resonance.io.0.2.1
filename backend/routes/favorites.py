from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
import logging

from database import get_database

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.get("", response_model=List[dict])
async def get_favorite_tracks(
    db: AsyncIOMotorDatabase = Depends(get_database),
    limit: int = Query(50, ge=1, le=500)
):
    """Get all favorite tracks"""
    try:
        favorites = await db.favorites.find().sort("added_date", -1).limit(limit).to_list(None)
        track_ids = [ObjectId(f["track_id"]) for f in favorites]
        
        tracks = await db.tracks.find({"_id": {"$in": track_ids}}).to_list(None)
        return tracks
    except Exception as e:
        logger.error(f"Error fetching favorites: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch favorites")


@router.post("/{track_id}")
async def add_to_favorites(
    track_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Add track to favorites"""
    try:
        # Check if track exists
        track = await db.tracks.find_one({"_id": ObjectId(track_id)})
        if not track:
            raise HTTPException(status_code=404, detail="Track not found")
        
        # Check if already favorited
        existing = await db.favorites.find_one({"track_id": track_id})
        if existing:
            return {"status": "already_favorited", "message": "Track already in favorites"}
        
        favorite_doc = {
            "track_id": track_id,
            "added_date": datetime.utcnow()
        }
        
        result = await db.favorites.insert_one(favorite_doc)
        return {"status": "success", "message": "Track added to favorites"}
    except Exception as e:
        logger.error(f"Error adding to favorites: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to add to favorites")


@router.delete("/{track_id}")
async def remove_from_favorites(
    track_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Remove track from favorites"""
    try:
        result = await db.favorites.delete_one({"track_id": track_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Track not in favorites")
        return {"status": "success", "message": "Track removed from favorites"}
    except Exception as e:
        logger.error(f"Error removing from favorites: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to remove from favorites")


@router.get("/check/{track_id}", response_model=dict)
async def check_is_favorite(
    track_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Check if track is favorited"""
    try:
        favorite = await db.favorites.find_one({"track_id": track_id})
        return {"is_favorite": favorite is not None}
    except Exception as e:
        logger.error(f"Error checking favorite: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to check favorite status")
