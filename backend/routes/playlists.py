from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
import logging

from models import Playlist, PlaylistCreate, PlaylistUpdate
from database import get_database

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/playlists", tags=["playlists"])


@router.post("", response_model=dict)
async def create_playlist(
    playlist: PlaylistCreate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Create a new playlist"""
    try:
        playlist_doc = {
            "name": playlist.name,
            "tracks": playlist.tracks,
            "created_date": datetime.utcnow(),
            "updated_date": datetime.utcnow(),
            "artwork_url": None
        }
        
        result = await db.playlists.insert_one(playlist_doc)
        playlist_doc["_id"] = result.inserted_id
        return {"id": str(result.inserted_id), **playlist_doc}
    except Exception as e:
        logger.error(f"Error creating playlist: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create playlist")


@router.get("", response_model=List[dict])
async def get_playlists(
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get all playlists"""
    try:
        playlists = await db.playlists.find().to_list(None)
        return [
            {"id": str(p["_id"]), "name": p.get("name"), "track_count": len(p.get("tracks", [])), "created_date": p.get("created_date")}
            for p in playlists
        ]
    except Exception as e:
        logger.error(f"Error fetching playlists: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch playlists")


@router.get("/{playlist_id}", response_model=dict)
async def get_playlist(
    playlist_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get playlist details with all tracks"""
    try:
        playlist = await db.playlists.find_one({"_id": ObjectId(playlist_id)})
        if not playlist:
            raise HTTPException(status_code=404, detail="Playlist not found")
        
        # Fetch track details for all tracks in playlist
        tracks = []
        if playlist.get("tracks"):
            tracks = await db.tracks.find({"_id": {"$in": [ObjectId(t) for t in playlist["tracks"]]}}).to_list(None)
        
        return {
            "id": str(playlist["_id"]),
            "name": playlist.get("name"),
            "tracks": tracks,
            "track_count": len(tracks),
            "created_date": playlist.get("created_date")
        }
    except Exception as e:
        logger.error(f"Error fetching playlist: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch playlist")


@router.put("/{playlist_id}", response_model=dict)
async def update_playlist(
    playlist_id: str,
    playlist_update: PlaylistUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update playlist name or tracks"""
    try:
        update_data = {}
        if playlist_update.name:
            update_data["name"] = playlist_update.name
        if playlist_update.tracks is not None:
            update_data["tracks"] = playlist_update.tracks
        
        update_data["updated_date"] = datetime.utcnow()
        
        result = await db.playlists.update_one(
            {"_id": ObjectId(playlist_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Playlist not found")
        
        return {"status": "success", "message": "Playlist updated"}
    except Exception as e:
        logger.error(f"Error updating playlist: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update playlist")


@router.delete("/{playlist_id}")
async def delete_playlist(
    playlist_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete a playlist"""
    try:
        result = await db.playlists.delete_one({"_id": ObjectId(playlist_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Playlist not found")
        return {"status": "success", "message": "Playlist deleted"}
    except Exception as e:
        logger.error(f"Error deleting playlist: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete playlist")


@router.post("/{playlist_id}/tracks/{track_id}")
async def add_track_to_playlist(
    playlist_id: str,
    track_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Add track to playlist"""
    try:
        result = await db.playlists.update_one(
            {"_id": ObjectId(playlist_id)},
            {
                "$addToSet": {"tracks": track_id},
                "$set": {"updated_date": datetime.utcnow()}
            }
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Playlist not found")
        return {"status": "success", "message": "Track added to playlist"}
    except Exception as e:
        logger.error(f"Error adding track to playlist: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to add track to playlist")


@router.delete("/{playlist_id}/tracks/{track_id}")
async def remove_track_from_playlist(
    playlist_id: str,
    track_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Remove track from playlist"""
    try:
        result = await db.playlists.update_one(
            {"_id": ObjectId(playlist_id)},
            {
                "$pull": {"tracks": track_id},
                "$set": {"updated_date": datetime.utcnow()}
            }
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Playlist not found")
        return {"status": "success", "message": "Track removed from playlist"}
    except Exception as e:
        logger.error(f"Error removing track from playlist: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to remove track from playlist")
