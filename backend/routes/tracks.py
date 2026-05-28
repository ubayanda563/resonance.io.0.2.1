import os
import logging
from typing import List, Optional

from bson import ObjectId
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, Request
from fastapi.responses import StreamingResponse, FileResponse

from models import Track, TrackCreate, TrackUpdate, LibraryStats
from services.file_service import FileService
from database import get_database
from utils import serialize_doc, serialize_docs

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/tracks", tags=["tracks"])
file_service = FileService()

# Max upload size: 50 MB
MAX_UPLOAD_BYTES = 50 * 1024 * 1024
ALLOWED_AUDIO_TYPES = {
    "audio/mpeg", "audio/mp3", "audio/mp4", "audio/ogg",
    "audio/flac", "audio/wav", "audio/x-wav", "audio/aac",
    "audio/webm", "audio/x-m4a",
}


@router.post("/upload", response_model=Track)
async def upload_track(
    file: UploadFile = File(...),
    db=Depends(get_database),
):
    """Upload a local audio file."""
    # Validate MIME type
    if file.content_type and file.content_type not in ALLOWED_AUDIO_TYPES:
        raise HTTPException(status_code=400, detail="Only audio files are allowed")

    try:
        file_info = await file_service.save_audio_file(file)
        metadata = file_info["metadata"]

        track_data = {
            "title": metadata.get("title") or os.path.splitext(file.filename)[0],
            "artist": metadata.get("artist") or "Unknown Artist",
            "album": metadata.get("album"),
            "genre": metadata.get("genre"),
            "duration": metadata.get("duration", 0),
            "file_path": file_info["file_path"],
            "artwork_url": file_info["artwork_url"],
            "source": "local",
            "file_size": file_info["file_size"],
            "format": file_info["format"],
            "mime_type": file_info.get("mime_type"),
            "upload_date": datetime.utcnow(),
            "play_count": 0,
        }

        result = await db.tracks.insert_one(track_data)
        track_data["id"] = str(result.inserted_id)
        return Track(**track_data)
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.error(f"Upload error: {exc}")
        raise HTTPException(status_code=500, detail="Failed to upload track")


@router.get("/", response_model=List[Track])
async def get_tracks(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    search: Optional[str] = Query(None),
    sort_by: str = Query("upload_date", pattern="^(title|artist|album|genre|upload_date|play_count)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    db=Depends(get_database),
):
    """Get tracks with filtering and pagination."""
    try:
        query: dict = {}
        if search:
            # Use full-text search if available; regex as fallback
            try:
                query = {"$text": {"$search": search}}
            except Exception:
                regex = {"$regex": search, "$options": "i"}
                query = {"$or": [{"title": regex}, {"artist": regex}, {"album": regex}]}

        sort_direction = 1 if sort_order == "asc" else -1
        cursor = db.tracks.find(query).sort([(sort_by, sort_direction)]).skip(offset).limit(limit)
        raw = await cursor.to_list(length=limit)
        return [Track(**serialize_doc(t)) for t in raw]
    except Exception as exc:
        logger.error(f"get_tracks error: {exc}")
        raise HTTPException(status_code=500, detail="Failed to get tracks")


@router.get("/recent", response_model=List[Track])
async def get_recent_tracks(
    limit: int = Query(20, ge=1, le=50),
    db=Depends(get_database),
):
    """Get recently added tracks."""
    try:
        cursor = db.tracks.find().sort("upload_date", -1).limit(limit)
        raw = await cursor.to_list(length=limit)
        return [Track(**serialize_doc(t)) for t in raw]
    except Exception as exc:
        logger.error(f"get_recent_tracks error: {exc}")
        raise HTTPException(status_code=500, detail="Failed to get recent tracks")


@router.get("/stats", response_model=LibraryStats)
async def get_library_stats(db=Depends(get_database)):
    """Aggregate library statistics."""
    try:
        pipeline = [
            {
                "$group": {
                    "_id": None,
                    "total_tracks": {"$sum": 1},
                    "local_tracks": {"$sum": {"$cond": [{"$eq": ["$source", "local"]}, 1, 0]}},
                    "youtube_tracks": {"$sum": {"$cond": [{"$eq": ["$source", "youtube"]}, 1, 0]}},
                    "total_duration": {"$sum": "$duration"},
                    "total_size": {"$sum": "$file_size"},
                    "artists": {"$addToSet": "$artist"},
                    "albums": {"$addToSet": "$album"},
                }
            }
        ]
        result = await db.tracks.aggregate(pipeline).to_list(1)
        playlists_count = await db.playlists.count_documents({})
        if result:
            s = result[0]
            return LibraryStats(
                total_tracks=s.get("total_tracks", 0),
                local_tracks=s.get("local_tracks", 0),
                youtube_tracks=s.get("youtube_tracks", 0),
                total_duration=s.get("total_duration", 0),
                total_size=s.get("total_size", 0),
                artists_count=len([a for a in s.get("artists", []) if a]),
                albums_count=len([a for a in s.get("albums", []) if a]),
                playlists_count=playlists_count,
            )
        return LibraryStats(
            total_tracks=0, local_tracks=0, youtube_tracks=0,
            total_duration=0, total_size=0, artists_count=0,
            albums_count=0, playlists_count=playlists_count,
        )
    except Exception as exc:
        logger.error(f"get_library_stats error: {exc}")
        raise HTTPException(status_code=500, detail="Failed to get library stats")


@router.get("/{track_id}", response_model=Track)
async def get_track(track_id: str, db=Depends(get_database)):
    if not ObjectId.is_valid(track_id):
        raise HTTPException(status_code=400, detail="Invalid track ID")
    track = await db.tracks.find_one({"_id": ObjectId(track_id)})
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
    return Track(**serialize_doc(track))


@router.put("/{track_id}", response_model=Track)
async def update_track(
    track_id: str,
    track_update: TrackUpdate,
    db=Depends(get_database),
):
    if not ObjectId.is_valid(track_id):
        raise HTTPException(status_code=400, detail="Invalid track ID")

    update_data = {k: v for k, v in track_update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")

    result = await db.tracks.update_one({"_id": ObjectId(track_id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Track not found")

    updated = await db.tracks.find_one({"_id": ObjectId(track_id)})
    return Track(**serialize_doc(updated))


@router.delete("/{track_id}")
async def delete_track(track_id: str, db=Depends(get_database)):
    if not ObjectId.is_valid(track_id):
        raise HTTPException(status_code=400, detail="Invalid track ID")

    track = await db.tracks.find_one({"_id": ObjectId(track_id)})
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    await db.tracks.delete_one({"_id": ObjectId(track_id)})

    if track.get("source") == "local" and track.get("file_path"):
        file_service.delete_file(track["file_path"])

    return {"message": "Track deleted successfully"}


# ---------------------------------------------------------------------------
# Streaming with HTTP Range support (enables seeking)
# ---------------------------------------------------------------------------
@router.get("/{track_id}/stream")
async def stream_track(
    track_id: str,
    request: Request,
    db=Depends(get_database),
):
    """Stream a local audio file with HTTP Range support for seeking."""
    if not ObjectId.is_valid(track_id):
        raise HTTPException(status_code=400, detail="Invalid track ID")

    track = await db.tracks.find_one({"_id": ObjectId(track_id)})
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    if track.get("source") != "local" or not track.get("file_path"):
        raise HTTPException(status_code=400, detail="Track is not a local file")

    file_path = track["file_path"]
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Audio file not found on disk")

    # Increment play count (fire-and-forget)
    try:
        await db.tracks.update_one({"_id": ObjectId(track_id)}, {"$inc": {"play_count": 1}})
    except Exception:
        pass

    file_size = os.path.getsize(file_path)
    mime = track.get("mime_type") or "audio/mpeg"

    range_header = request.headers.get("Range")
    if range_header:
        # Parse "bytes=start-end"
        try:
            byte_range = range_header.strip().replace("bytes=", "")
            start_str, _, end_str = byte_range.partition("-")
            start = int(start_str) if start_str else 0
            end = int(end_str) if end_str else file_size - 1
        except ValueError:
            raise HTTPException(status_code=416, detail="Invalid Range header")

        if start >= file_size or end >= file_size or start > end:
            raise HTTPException(
                status_code=416,
                detail="Range Not Satisfiable",
                headers={"Content-Range": f"bytes */{file_size}"},
            )

        chunk_size = end - start + 1

        def iter_file():
            with open(file_path, "rb") as f:
                f.seek(start)
                remaining = chunk_size
                while remaining:
                    data = f.read(min(65536, remaining))
                    if not data:
                        break
                    remaining -= len(data)
                    yield data

        return StreamingResponse(
            iter_file(),
            status_code=206,
            media_type=mime,
            headers={
                "Content-Range": f"bytes {start}-{end}/{file_size}",
                "Accept-Ranges": "bytes",
                "Content-Length": str(chunk_size),
                "Cache-Control": "no-cache",
            },
        )

    # Full file response
    def iter_full():
        with open(file_path, "rb") as f:
            while chunk := f.read(65536):
                yield chunk

    return StreamingResponse(
        iter_full(),
        media_type=mime,
        headers={
            "Content-Length": str(file_size),
            "Accept-Ranges": "bytes",
            "Cache-Control": "no-cache",
        },
    )
