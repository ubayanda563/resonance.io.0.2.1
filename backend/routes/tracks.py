from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import FileResponse
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
import os
import logging

from models import Track, TrackCreate, TrackUpdate, LibraryStats
from services.file_service import FileService
from database import get_database

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/tracks", tags=["tracks"])
file_service = FileService()


@router.post("/upload", response_model=Track)
async def upload_track(
    file: UploadFile = File(...),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Upload a local audio file"""
    try:
        # Validate file type using browser-provided metadata and mutagen detection
        if file.content_type and not file.content_type.startswith('audio/'):
            raise HTTPException(status_code=400, detail="Only audio files are allowed")

        # Save file and extract metadata
        file_info = await file_service.save_audio_file(file)
        metadata = file_info["metadata"]
        
        # Create track document
        track_data = {
            "title": metadata.get("title") or os.path.splitext(file.filename)[0],
            "artist": metadata.get("artist") or "Unknown Artist",
            "album": metadata.get("album"),
            "duration": metadata.get("duration", 0),
            "file_path": file_info["file_path"],
            "artwork_url": file_info["artwork_url"],
            "source": "local",
            "file_size": file_info["file_size"],
            "format": file_info["format"],
            "mime_type": file_info.get("mime_type"),
            "upload_date": datetime.utcnow(),
            "play_count": 0
        }
        
        # Insert into database
        result = await db.tracks.insert_one(track_data)
        track_data["id"] = str(result.inserted_id)
        
        return Track(**track_data)
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid audio file: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error uploading track: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to upload track")


@router.get("/", response_model=List[Track])
async def get_tracks(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    search: Optional[str] = Query(None),
    sort_by: str = Query("upload_date", regex="^(title|artist|album|upload_date|play_count)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get tracks with filtering and pagination"""
    try:
        # Build query
        query = {}
        if search:
            query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"artist": {"$regex": search, "$options": "i"}},
                {"album": {"$regex": search, "$options": "i"}}
            ]
        
        # Build sort
        sort_direction = 1 if sort_order == "asc" else -1
        sort_spec = [(sort_by, sort_direction)]
        
        # Execute query
        cursor = db.tracks.find(query).sort(sort_spec).skip(offset).limit(limit)
        tracks = await cursor.to_list(length=limit)
        
        # Convert ObjectId to string and normalize to 'id' field
        result_tracks = []
        for track in tracks:
            if "_id" in track:
                track["id"] = str(track["_id"])  # Add 'id' field
                del track["_id"]  # Remove '_id' field
            result_tracks.append(track)
        
        try:
            return [Track(**track) for track in result_tracks]
        except Exception as e:
            # If Track instantiation fails, log the track data for debugging
            logger.error(f"Failed to create Track instances: {str(e)}, Track data: {result_tracks[0] if result_tracks else 'empty'}")
            raise
    except Exception as e:
        logger.error(f"Error getting tracks: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get tracks")


@router.get("/recent", response_model=List[Track])
async def get_recent_tracks(
    limit: int = Query(20, ge=1, le=50),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get recently added tracks"""
    try:
        cursor = db.tracks.find().sort("upload_date", -1).limit(limit)
        tracks = await cursor.to_list(length=limit)
        
        # Convert _id to id field
        result_tracks = []
        for track in tracks:
            if "_id" in track:
                track["id"] = str(track["_id"])
                del track["_id"]
            result_tracks.append(track)
        
        return [Track(**track) for track in result_tracks]
    except Exception as e:
        logger.error(f"Error getting recent tracks: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get recent tracks")


@router.get("/stats", response_model=LibraryStats)
async def get_library_stats(db: AsyncIOMotorDatabase = Depends(get_database)):
    """Get library statistics"""
    try:
        # Aggregate statistics
        pipeline = [
            {
                "$group": {
                    "_id": None,
                    "total_tracks": {"$sum": 1},
                    "local_tracks": {
                        "$sum": {"$cond": [{"$eq": ["$source", "local"]}, 1, 0]}
                    },
                    "youtube_tracks": {
                        "$sum": {"$cond": [{"$eq": ["$source", "youtube"]}, 1, 0]}
                    },
                    "total_duration": {"$sum": "$duration"},
                    "total_size": {"$sum": "$file_size"},
                    "artists": {"$addToSet": "$artist"},
                    "albums": {"$addToSet": "$album"}
                }
            }
        ]
        
        result = await db.tracks.aggregate(pipeline).to_list(1)
        
        if result:
            stats = result[0]
            # Count playlists
            playlists_count = await db.playlists.count_documents({})
            
            return LibraryStats(
                total_tracks=stats.get("total_tracks", 0),
                local_tracks=stats.get("local_tracks", 0),
                youtube_tracks=stats.get("youtube_tracks", 0),
                total_duration=stats.get("total_duration", 0),
                total_size=stats.get("total_size", 0),
                artists_count=len([a for a in stats.get("artists", []) if a]),
                albums_count=len([a for a in stats.get("albums", []) if a]),
                playlists_count=playlists_count
            )
        else:
            return LibraryStats(
                total_tracks=0, local_tracks=0, youtube_tracks=0,
                total_duration=0, total_size=0, artists_count=0,
                albums_count=0, playlists_count=0
            )
    except Exception as e:
        logger.error(f"Error getting library stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get library stats")


@router.get("/{track_id}", response_model=Track)
async def get_track(
    track_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get a specific track"""
    try:
        if not ObjectId.is_valid(track_id):
            raise HTTPException(status_code=400, detail="Invalid track ID")
        
        track = await db.tracks.find_one({"_id": ObjectId(track_id)})
        if not track:
            raise HTTPException(status_code=404, detail="Track not found")
        
        track["id"] = str(track["_id"])
        del track["_id"]
        return Track(**track)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting track: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get track")


@router.put("/{track_id}", response_model=Track)
async def update_track(
    track_id: str,
    track_update: TrackUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update track metadata"""
    try:
        if not ObjectId.is_valid(track_id):
            raise HTTPException(status_code=400, detail="Invalid track ID")
        
        # Build update data
        update_data = {k: v for k, v in track_update.dict().items() if v is not None}
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No update data provided")
        
        # Update track
        result = await db.tracks.update_one(
            {"_id": ObjectId(track_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Track not found")
        
        # Return updated track
        updated_track = await db.tracks.find_one({"_id": ObjectId(track_id)})
        updated_track["id"] = str(updated_track["_id"])
        del updated_track["_id"]
        
        return Track(**updated_track)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating track: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update track")


@router.delete("/{track_id}")
async def delete_track(
    track_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete a track"""
    try:
        if not ObjectId.is_valid(track_id):
            raise HTTPException(status_code=400, detail="Invalid track ID")
        
        # Get track info first
        track = await db.tracks.find_one({"_id": ObjectId(track_id)})
        if not track:
            raise HTTPException(status_code=404, detail="Track not found")
        
        # Delete from database
        await db.tracks.delete_one({"_id": ObjectId(track_id)})
        
        # Delete file if it's a local track
        if track.get("source") == "local" and track.get("file_path"):
            file_service.delete_file(track["file_path"])
        
        return {"message": "Track deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting track: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete track")


@router.get("/{track_id}/stream")
async def stream_track(
    track_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Stream a local audio file"""
    try:
        if not ObjectId.is_valid(track_id):
            raise HTTPException(status_code=400, detail="Invalid track ID")
        
        track = await db.tracks.find_one({"_id": ObjectId(track_id)})
        if not track:
            raise HTTPException(status_code=404, detail="Track not found")
        
        if track.get("source") != "local" or not track.get("file_path"):
            raise HTTPException(status_code=400, detail="Track is not a local file")
        
        file_path = track["file_path"]
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Audio file not found")
        
        # Update play count
        await db.tracks.update_one(
            {"_id": ObjectId(track_id)},
            {"$inc": {"play_count": 1}}
        )
        
        return FileResponse(
            path=file_path,
            filename=f"{track['title']}.{track.get('format') or 'bin'}",
            media_type=track.get("mime_type") or "application/octet-stream"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error streaming track: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to stream track")