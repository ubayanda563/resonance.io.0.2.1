from fastapi import FastAPI, APIRouter, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from pathlib import Path
from urllib.parse import unquote
from datetime import datetime
import os
import logging
import asyncio
import sys
import json
from pathlib import Path

# Add backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Import routes
from routes import tracks, youtube, artwork, playlists, favorites, recommendations, search
from database import create_indexes
from models import Track

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Custom JSON encoder using Pydantic's encoder
def custom_json_encoder(obj):
    if isinstance(obj, Track):
        data = obj.model_dump()
        # Convert _id to id for JSON output
        if '_id' in data:
            data['id'] = data.pop('_id')
        return data
    # Use default Pydantic encoder
    from pydantic import BaseModel
    if isinstance(obj, BaseModel):
        return obj.model_dump()
    raise TypeError(f"Type {type(obj)} not serializable")

# Create the main app without a prefix
app = FastAPI(
    title="Resonance Music Player API",
    version="1.0.0"
)


@app.middleware("http")
async def block_path_traversal(request: Request, call_next):
    raw_path = request.scope.get("raw_path")
    if raw_path is not None:
        raw_path_str = raw_path.decode("latin-1") if isinstance(raw_path, (bytes, bytearray)) else str(raw_path)
        decoded_raw_path = unquote(raw_path_str)
        if ".." in raw_path_str or ".." in decoded_raw_path:
            return JSONResponse({"detail": "Invalid path"}, status_code=400)

    if ".." in request.url.path:
        return JSONResponse({"detail": "Invalid path"}, status_code=400)

    return await call_next(request)


# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Include all route modules
api_router.include_router(tracks.router)
api_router.include_router(youtube.router)
api_router.include_router(artwork.router)
api_router.include_router(playlists.router)
api_router.include_router(favorites.router)
api_router.include_router(recommendations.router)
api_router.include_router(search.router)

# Legacy hello world endpoint
@api_router.get("/")
async def root():
    return {"message": "Resonance Music Player API"}

# Include the router in the main app
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup_event():
    """Initialize database indexes on startup"""
    logger.info("Starting Resonance Music Player API...")
    try:
        # Schedule index creation without blocking startup
        asyncio.create_task(create_indexes())
        
        # Seed sample tracks if database is empty
        from database import database
        count = await database.tracks.count_documents({})
        if count == 0:
            logger.info("Seeding sample tracks...")
            sample_tracks = [
                {
                    "title": "MISS MY DOGS",
                    "artist": "YOUNG THUG — UY SC ...",
                    "duration": 180,
                    "artwork_url": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center",
                    "upload_date": datetime.utcnow(),
                },
                {
                    "title": "AUD-20250926-W...",
                    "artist": "UNKNOWN ARTIST",
                    "duration": 240,
                    "artwork_url": "https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?w=400&h=400&fit=crop&crop=center",
                    "upload_date": datetime.utcnow(),
                },
                {
                    "title": "DREAMS RARELY D...",
                    "artist": "YOUNG THUG; MARIAH ...",
                    "duration": 200,
                    "artwork_url": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center",
                    "upload_date": datetime.utcnow(),
                }
            ]
            await database.tracks.insert_many(sample_tracks)
            logger.info(f"Seeded {len(sample_tracks)} sample tracks")
    except Exception as e:
        logger.warning(f"Failed to schedule index creation or seed tracks: {e}")
    logger.info("Resonance Music Player API started successfully")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down Resonance Music Player API...")
    
    # Close MongoDB connection if configured
    from database import client
    if client is not None:
        client.close()
    
    logger.info("Resonance Music Player API shut down successfully")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)