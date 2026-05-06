from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
import logging

from models import YouTubeSearchResult, Track, TrackCreate
from services.youtube_service import YouTubeService
from database import get_database

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/youtube", tags=["youtube"])
youtube_service = YouTubeService()


@router.get("/search", response_model=List[YouTubeSearchResult])
async def search_youtube(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(10, ge=1, le=25, description="Number of results")
):
    """Search for tracks on YouTube Music"""
    try:
        results = youtube_service.search_tracks(q, limit)
        return results
    except Exception as e:
        logger.error(f"Error searching YouTube: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to search YouTube")


@router.get("/track/{youtube_id}")
async def get_youtube_track_info(youtube_id: str):
    """Get detailed information about a YouTube track"""
    try:
        track_info = youtube_service.get_track_info(youtube_id)
        if not track_info:
            raise HTTPException(status_code=404, detail="Track not found")
        
        return track_info
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting YouTube track info: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get track info")


@router.get("/stream/{youtube_id}")
async def get_youtube_stream_url(youtube_id: str):
    """Get the stream URL for a YouTube track"""
    try:
        stream_url = youtube_service.get_stream_url(youtube_id)
        if not stream_url:
            raise HTTPException(status_code=404, detail="Stream URL not found")
        
        return {"stream_url": stream_url}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting YouTube stream URL: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get stream URL")


@router.post("/add-track", response_model=Track)
async def add_youtube_track(
    youtube_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Add a YouTube track to the library"""
    try:
        # Check if track already exists
        existing_track = await db.tracks.find_one({"youtube_id": youtube_id})
        if existing_track:
            existing_track["id"] = str(existing_track["_id"])
            del existing_track["_id"]
            return Track(**existing_track)
        
        # Get track info from YouTube
        track_info = youtube_service.get_track_info(youtube_id)
        if not track_info:
            raise HTTPException(status_code=404, detail="YouTube track not found")
        
        # Create track document
        track_data = {
            "title": track_info.title,
            "artist": track_info.artist,
            "duration": track_info.duration,
            "youtube_id": youtube_id,
            "youtube_url": track_info.url,
            "artwork_url": track_info.thumbnail,
            "source": "youtube",
            "upload_date": datetime.utcnow(),
            "play_count": 0
        }
        
        # Insert into database
        result = await db.tracks.insert_one(track_data)
        track_data["id"] = str(result.inserted_id)
        
        return Track(**track_data)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding YouTube track: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to add YouTube track")