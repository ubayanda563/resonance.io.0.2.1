import logging
from typing import List

from bson import ObjectId
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query

from models import Playlist, PlaylistCreate, PlaylistUpdate
from database import get_database
from utils import serialize_doc

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/playlists", tags=["playlists"])


@router.post("", response_model=dict)
async def create_playlist(playlist: PlaylistCreate, db=Depends(get_database)):
    try:
        doc = {
            "name": playlist.name.strip(),
            "tracks": playlist.tracks,
            "created_date": datetime.utcnow(),
            "updated_date": datetime.utcnow(),
            "artwork_url": None,
        }
        result = await db.playlists.insert_one(doc)
        return {"id": str(result.inserted_id), **doc}
    except Exception as exc:
        logger.error(f"create_playlist error: {exc}")
        raise HTTPException(status_code=500, detail="Failed to create playlist")


@router.get("", response_model=List[dict])
async def get_playlists(db=Depends(get_database)):
    try:
        playlists = await db.playlists.find().sort("created_date", -1).to_list(200)
        return [
            {
                "id": str(p["_id"]),
                "name": p.get("name"),
                "track_count": len(p.get("tracks", [])),
                "created_date": p.get("created_date"),
            }
            for p in playlists
        ]
    except Exception as exc:
        logger.error(f"get_playlists error: {exc}")
        raise HTTPException(status_code=500, detail="Failed to fetch playlists")


@router.get("/{playlist_id}", response_model=dict)
async def get_playlist(playlist_id: str, db=Depends(get_database)):
    if not ObjectId.is_valid(playlist_id):
        raise HTTPException(status_code=400, detail="Invalid playlist ID")

    playlist = await db.playlists.find_one({"_id": ObjectId(playlist_id)})
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")

    tracks = []
    if playlist.get("tracks"):
        try:
            raw = await db.tracks.find(
                {"_id": {"$in": [ObjectId(t) for t in playlist["tracks"]]}}
            ).to_list(500)
            tracks = [serialize_doc(t) for t in raw]
        except Exception:
            pass

    return {
        "id": str(playlist["_id"]),
        "name": playlist.get("name"),
        "tracks": tracks,
        "track_count": len(tracks),
        "created_date": playlist.get("created_date"),
    }


@router.put("/{playlist_id}", response_model=dict)
async def update_playlist(
    playlist_id: str,
    playlist_update: PlaylistUpdate,
    db=Depends(get_database),
):
    if not ObjectId.is_valid(playlist_id):
        raise HTTPException(status_code=400, detail="Invalid playlist ID")

    update_data = {k: v for k, v in playlist_update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    update_data["updated_date"] = datetime.utcnow()

    result = await db.playlists.update_one(
        {"_id": ObjectId(playlist_id)}, {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return {"status": "success"}


@router.delete("/{playlist_id}")
async def delete_playlist(playlist_id: str, db=Depends(get_database)):
    if not ObjectId.is_valid(playlist_id):
        raise HTTPException(status_code=400, detail="Invalid playlist ID")
    result = await db.playlists.delete_one({"_id": ObjectId(playlist_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return {"status": "success"}


@router.post("/{playlist_id}/tracks/{track_id}")
async def add_track_to_playlist(
    playlist_id: str, track_id: str, db=Depends(get_database)
):
    if not ObjectId.is_valid(playlist_id):
        raise HTTPException(status_code=400, detail="Invalid playlist ID")
    result = await db.playlists.update_one(
        {"_id": ObjectId(playlist_id)},
        {"$addToSet": {"tracks": track_id}, "$set": {"updated_date": datetime.utcnow()}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return {"status": "success"}


@router.delete("/{playlist_id}/tracks/{track_id}")
async def remove_track_from_playlist(
    playlist_id: str, track_id: str, db=Depends(get_database)
):
    if not ObjectId.is_valid(playlist_id):
        raise HTTPException(status_code=400, detail="Invalid playlist ID")
    result = await db.playlists.update_one(
        {"_id": ObjectId(playlist_id)},
        {"$pull": {"tracks": track_id}, "$set": {"updated_date": datetime.utcnow()}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return {"status": "success"}
