from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import os
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/artwork", tags=["artwork"])

ARTWORK_DIR = "/app/backend/uploads/artwork"


@router.get("/{filename:path}")
async def get_artwork(filename: str):
    """Serve artwork files"""
    try:
        # Resolve the requested artwork file path and prevent directory traversal
        requested_path = os.path.abspath(os.path.join(ARTWORK_DIR, filename))
        artwork_dir_path = os.path.abspath(ARTWORK_DIR)
        if not requested_path.startswith(artwork_dir_path + os.sep):
            raise HTTPException(status_code=400, detail="Invalid filename")

        file_path = requested_path
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Artwork not found")
        
        return FileResponse(
            path=file_path,
            media_type="image/jpeg",
            filename=filename
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error serving artwork: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to serve artwork")