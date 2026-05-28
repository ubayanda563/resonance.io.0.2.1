import logging
from typing import List

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query

from database import get_database
from utils import serialize_docs

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/search", tags=["search"])


@router.get("/tracks", response_model=List[dict])
async def search_tracks(
    q: str = Query(..., min_length=1, max_length=200),
    db=Depends(get_database),
    limit: int = Query(20, ge=1, le=100),
):
    """Search tracks — uses full-text index when available, regex fallback."""
    try:
        # Persist search query (non-blocking; deduplicate by query text)
        try:
            existing = await db.search_history.find_one({"query": q})
            if existing:
                await db.search_history.update_one(
                    {"query": q},
                    {"$set": {"timestamp": datetime.utcnow()}},
                )
            else:
                await db.search_history.insert_one(
                    {"query": q, "timestamp": datetime.utcnow(), "type": "track"}
                )
        except Exception:
            pass

        # Try $text index first, fall back to regex
        try:
            raw = await db.tracks.find({"$text": {"$search": q}}).limit(limit).to_list(limit)
            if raw:
                return serialize_docs(raw)
        except Exception:
            pass

        regex = {"$regex": q, "$options": "i"}
        raw = await db.tracks.find({
            "$or": [{"title": regex}, {"artist": regex}, {"album": regex}, {"genre": regex}]
        }).limit(limit).to_list(limit)
        return serialize_docs(raw)
    except Exception as exc:
        logger.error(f"search_tracks error: {exc}")
        raise HTTPException(status_code=500, detail="Failed to search tracks")


@router.get("/artists", response_model=List[dict])
async def search_artists(
    q: str = Query(..., min_length=1, max_length=200),
    db=Depends(get_database),
):
    """Return unique artist summaries matching query."""
    try:
        regex = {"$regex": q, "$options": "i"}
        raw = await db.tracks.find({"artist": regex}).to_list(500)

        unique: dict = {}
        for track in raw:
            artist = track.get("artist")
            if not artist:
                continue
            if artist not in unique:
                unique[artist] = {"artist": artist, "track_count": 0, "sample_artwork": None}
            unique[artist]["track_count"] += 1
            if not unique[artist]["sample_artwork"]:
                unique[artist]["sample_artwork"] = track.get("artwork_url")

        return list(unique.values())
    except Exception as exc:
        logger.error(f"search_artists error: {exc}")
        raise HTTPException(status_code=500, detail="Failed to search artists")


@router.get("/history", response_model=List[dict])
async def get_search_history(
    db=Depends(get_database),
    limit: int = Query(10, ge=1, le=50),
):
    try:
        history = await db.search_history.find().sort("timestamp", -1).limit(limit).to_list(limit)
        return [{"query": h.get("query"), "timestamp": h.get("timestamp")} for h in history]
    except Exception as exc:
        logger.error(f"get_search_history error: {exc}")
        raise HTTPException(status_code=500, detail="Failed to fetch search history")


@router.delete("/history")
async def clear_search_history(db=Depends(get_database)):
    try:
        await db.search_history.delete_many({})
        return {"status": "success"}
    except Exception as exc:
        logger.error(f"clear_search_history error: {exc}")
        raise HTTPException(status_code=500, detail="Failed to clear search history")


@router.delete("/history/{query}")
async def delete_search_history_item(query: str, db=Depends(get_database)):
    result = await db.search_history.delete_one({"query": query})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Search history item not found")
    return {"status": "success"}
