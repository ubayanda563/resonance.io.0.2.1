from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
import logging

from database import get_database

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/search", tags=["search"])


@router.get("/tracks", response_model=List[dict])
async def search_tracks(
    q: str = Query(..., min_length=1),
    db: AsyncIOMotorDatabase = Depends(get_database),
    limit: int = Query(20, ge=1, le=100)
):
    """Search tracks by title, artist, or album"""
    try:
        # Save search query to history
        search_doc = {
            "query": q,
            "timestamp": datetime.utcnow(),
            "type": "track"
        }
        await db.search_history.insert_one(search_doc)
        
        # Search in tracks
        search_regex = {"$regex": q, "$options": "i"}
        tracks = await db.tracks.find({
            "$or": [
                {"title": search_regex},
                {"artist": search_regex},
                {"album": search_regex}
            ]
        }).limit(limit).to_list(None)
        
        return tracks
    except Exception as e:
        logger.error(f"Error searching tracks: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to search tracks")


@router.get("/artists", response_model=List[dict])
async def search_artists(
    q: str = Query(..., min_length=1),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Search by artist name and return all their tracks"""
    try:
        search_regex = {"$regex": q, "$options": "i"}
        artists = await db.tracks.find({
            "artist": search_regex
        }).to_list(None)
        
        # Group by artist and return unique artists
        unique_artists = {}
        for track in artists:
            artist = track.get("artist")
            if artist not in unique_artists:
                unique_artists[artist] = {
                    "artist": artist,
                    "track_count": 0,
                    "sample_artwork": None
                }
            unique_artists[artist]["track_count"] += 1
            if not unique_artists[artist]["sample_artwork"]:
                unique_artists[artist]["sample_artwork"] = track.get("artwork_url")
        
        return list(unique_artists.values())
    except Exception as e:
        logger.error(f"Error searching artists: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to search artists")


@router.get("/history", response_model=List[dict])
async def get_search_history(
    db: AsyncIOMotorDatabase = Depends(get_database),
    limit: int = Query(10, ge=1, le=50)
):
    """Get search history"""
    try:
        history = await db.search_history.find().sort("timestamp", -1).limit(limit).to_list(None)
        return [{"query": h.get("query"), "timestamp": h.get("timestamp")} for h in history]
    except Exception as e:
        logger.error(f"Error fetching search history: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch search history")


@router.delete("/history")
async def clear_search_history(
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Clear all search history"""
    try:
        await db.search_history.delete_many({})
        return {"status": "success", "message": "Search history cleared"}
    except Exception as e:
        logger.error(f"Error clearing search history: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to clear search history")


@router.delete("/history/{query}")
async def delete_search_history_item(
    query: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete specific search history item"""
    try:
        result = await db.search_history.delete_one({"query": query})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Search history item not found")
        return {"status": "success", "message": "Search history item deleted"}
    except Exception as e:
        logger.error(f"Error deleting search history: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete search history")
