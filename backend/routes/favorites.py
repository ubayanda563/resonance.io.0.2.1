import logging
from typing import List

from bson import ObjectId
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query

from database import get_database
from utils import serialize_doc

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.get("", response_model=List[dict])
async def get_favorite_tracks(
    db=Depends(get_database),
    limit: int = Query(50, ge=1, le=500),
):
    """Get all favorite tracks using a single aggregation pipeline."""
    try:
        # Single query: join favorites → tracks
        pipeline = [
            {"$sort": {"added_date": -1}},
            {"$limit": limit},
            {
                "$lookup": {
                    "from": "tracks",
                    "let": {"tid": "$track_id"},
                    "pipeline": [
                        {"$match": {"$expr": {"$eq": [{"$toString": "$_id"}, "$$tid"]}}},
                        {"$limit": 1},
                    ],
                    "as": "track",
                }
            },
            {"$unwind": "$track"},
            {"$replaceRoot": {"newRoot": "$track"}},
        ]

        # Fallback for in-memory DB (no $lookup support) — two-step query
        try:
            tracks = await db.favorites.aggregate(pipeline).to_list(limit)
            if not tracks:
                raise Exception("fallback")
        except Exception:
            favs = await db.favorites.find().sort("added_date", -1).limit(limit).to_list(limit)
            track_ids = [f["track_id"] for f in favs]
            tracks = []
            for tid in track_ids:
                try:
                    t = await db.tracks.find_one({"_id": ObjectId(tid)})
                    if t:
                        tracks.append(t)
                except Exception:
                    pass

        return [serialize_doc(t) for t in tracks]
    except Exception as exc:
        logger.error(f"get_favorites error: {exc}")
        raise HTTPException(status_code=500, detail="Failed to fetch favorites")


@router.post("/{track_id}")
async def add_to_favorites(track_id: str, db=Depends(get_database)):
    """Add track to favorites (idempotent)."""
    if not ObjectId.is_valid(track_id):
        raise HTTPException(status_code=400, detail="Invalid track ID")

    track = await db.tracks.find_one({"_id": ObjectId(track_id)})
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    existing = await db.favorites.find_one({"track_id": track_id})
    if existing:
        return {"status": "already_favorited"}

    await db.favorites.insert_one({"track_id": track_id, "added_date": datetime.utcnow()})
    return {"status": "success", "message": "Track added to favorites"}


@router.delete("/{track_id}")
async def remove_from_favorites(track_id: str, db=Depends(get_database)):
    """Remove track from favorites."""
    result = await db.favorites.delete_one({"track_id": track_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Track not in favorites")
    return {"status": "success", "message": "Track removed from favorites"}


@router.get("/check/{track_id}", response_model=dict)
async def check_is_favorite(track_id: str, db=Depends(get_database)):
    fav = await db.favorites.find_one({"track_id": track_id})
    return {"is_favorite": fav is not None}
