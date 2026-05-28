import logging
from typing import List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from database import get_database
from utils import serialize_docs

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("/similar/{track_id}", response_model=List[dict])
async def get_similar_tracks(
    track_id: str,
    db=Depends(get_database),
    limit: int = Query(10, ge=1, le=50),
):
    """Similar tracks: same artist → same genre → most played."""
    if not ObjectId.is_valid(track_id):
        raise HTTPException(status_code=400, detail="Invalid track ID")

    track = await db.tracks.find_one({"_id": ObjectId(track_id)})
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    oid = ObjectId(track_id)
    results: list = []

    # 1. Same artist
    by_artist = await db.tracks.find(
        {"_id": {"$ne": oid}, "artist": track.get("artist")}
    ).limit(limit).to_list(limit)
    results.extend(by_artist)

    # 2. Same genre (if field exists and we still need more)
    if len(results) < limit and track.get("genre"):
        seen_ids = {str(t["_id"]) for t in results}
        by_genre = await db.tracks.find(
            {"_id": {"$ne": oid}, "genre": track.get("genre")}
        ).limit(limit).to_list(limit)
        results.extend([t for t in by_genre if str(t["_id"]) not in seen_ids])

    # 3. Most played as final fallback
    if len(results) < limit:
        seen_ids = {str(t["_id"]) for t in results} | {track_id}
        popular = await db.tracks.find(
            {"_id": {"$ne": oid}}
        ).sort("play_count", -1).limit(limit).to_list(limit)
        results.extend([t for t in popular if str(t["_id"]) not in seen_ids])

    return serialize_docs(results[:limit])


@router.get("/artist/{artist}", response_model=List[dict])
async def get_artist_discography(
    artist: str,
    db=Depends(get_database),
    limit: int = Query(20, ge=1, le=100),
):
    raw = await db.tracks.find(
        {"artist": {"$regex": artist, "$options": "i"}}
    ).sort("upload_date", -1).limit(limit).to_list(limit)
    return serialize_docs(raw)


@router.get("/trending", response_model=List[dict])
async def get_trending_tracks(
    db=Depends(get_database),
    limit: int = Query(20, ge=1, le=100),
):
    raw = await db.tracks.find().sort("play_count", -1).limit(limit).to_list(limit)
    return serialize_docs(raw)


@router.get("/fresh", response_model=List[dict])
async def get_fresh_tracks(
    db=Depends(get_database),
    days: int = Query(7, ge=1, le=90),
    limit: int = Query(20, ge=1, le=100),
):
    from datetime import timedelta, datetime
    start_date = datetime.utcnow() - timedelta(days=days)
    raw = await db.tracks.find(
        {"upload_date": {"$gte": start_date}}
    ).sort("upload_date", -1).limit(limit).to_list(limit)
    return serialize_docs(raw)


@router.get("/genres/{genre}", response_model=List[dict])
async def get_genre_tracks(
    genre: str,
    db=Depends(get_database),
    limit: int = Query(20, ge=1, le=100),
):
    """Tracks by genre field (with album fallback)."""
    raw = await db.tracks.find(
        {"genre": {"$regex": genre, "$options": "i"}}
    ).sort("play_count", -1).limit(limit).to_list(limit)

    if not raw:
        # Fallback: album field contains genre string
        raw = await db.tracks.find(
            {"album": {"$regex": genre, "$options": "i"}}
        ).sort("play_count", -1).limit(limit).to_list(limit)

    if not raw:
        raw = await db.tracks.find().sort("play_count", -1).limit(limit).to_list(limit)

    return serialize_docs(raw)
