import logging
from typing import List

from bson import ObjectId
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query

from models import YouTubeSearchResult, Track
from services.youtube_service import YouTubeService
from database import get_database
from utils import serialize_doc

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/youtube", tags=["youtube"])
youtube_service = YouTubeService()


@router.get("/search", response_model=List[YouTubeSearchResult])
async def search_youtube(
    q: str = Query(..., min_length=1, max_length=200),
    limit: int = Query(10, ge=1, le=25),
):
    try:
        return youtube_service.search_tracks(q, limit)
    except Exception as exc:
        logger.error(f"YouTube search error: {exc}")
        raise HTTPException(status_code=500, detail="Failed to search YouTube")


@router.get("/track/{youtube_id}")
async def get_youtube_track_info(youtube_id: str):
    try:
        info = youtube_service.get_track_info(youtube_id)
        if not info:
            raise HTTPException(status_code=404, detail="Track not found")
        return info
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"YouTube track info error: {exc}")
        raise HTTPException(status_code=500, detail="Failed to get track info")


@router.get("/stream/{youtube_id}")
async def get_youtube_stream_url(youtube_id: str):
    try:
        url = youtube_service.get_stream_url(youtube_id)
        if not url:
            raise HTTPException(status_code=404, detail="Stream URL not found")
        return {"stream_url": url}
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"YouTube stream URL error: {exc}")
        raise HTTPException(status_code=500, detail="Failed to get stream URL")


@router.post("/add-track", response_model=Track)
async def add_youtube_track(youtube_id: str, db=Depends(get_database)):
    """Add a YouTube track to the library (idempotent)."""
    # Return existing if already saved
    existing = await db.tracks.find_one({"youtube_id": youtube_id})
    if existing:
        return Track(**serialize_doc(existing))

    try:
        info = youtube_service.get_track_info(youtube_id)
        if not info:
            raise HTTPException(status_code=404, detail="YouTube track not found")

        track_data = {
            "title": info.title,
            "artist": info.artist,
            "duration": info.duration,
            "youtube_id": youtube_id,
            "youtube_url": info.url,
            "artwork_url": info.thumbnail,
            "source": "youtube",
            "upload_date": datetime.utcnow(),
            "play_count": 0,
        }
        result = await db.tracks.insert_one(track_data)
        track_data["id"] = str(result.inserted_id)
        return Track(**track_data)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"add_youtube_track error: {exc}")
        raise HTTPException(status_code=500, detail="Failed to add YouTube track")


@router.post("/play/{youtube_id}")
async def increment_youtube_play_count(youtube_id: str, db=Depends(get_database)):
    """Increment play count for a YouTube track."""
    result = await db.tracks.update_one(
        {"youtube_id": youtube_id}, {"$inc": {"play_count": 1}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Track not found")
    return {"status": "ok"}
