from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from pathlib import Path
from urllib.parse import unquote
from datetime import datetime, UTC
import os
import logging
import asyncio
import sys

backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from routes import tracks, youtube, artwork, playlists, favorites, recommendations, search, enrichment
from database import create_indexes
from models import Track

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Allowed frontend origins — extend via ALLOWED_ORIGINS env var (comma-sep)
# ---------------------------------------------------------------------------
_raw_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000")
ALLOWED_ORIGINS: list[str] = [o.strip() for o in _raw_origins.split(",") if o.strip()]


# ---------------------------------------------------------------------------
# Lifespan (replaces deprecated @app.on_event)
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown logic."""
    logger.info("Starting Resonance Music Player API …")
    try:
        asyncio.create_task(create_indexes())

        from database import database
        count = await database.tracks.count_documents({})
        if count == 0:
            logger.info("Seeding sample tracks …")
            sample_tracks = [
                {
                    "title": "MISS MY DOGS",
                    "artist": "Young Thug",
                    "duration": 180,
                    "artwork_url": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
                    "upload_date": datetime.now(UTC),
                    "play_count": 0,
                    "source": "local",
                },
                {
                    "title": "Dreams Rarely Die",
                    "artist": "Young Thug",
                    "duration": 200,
                    "artwork_url": "https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?w=400&h=400&fit=crop",
                    "upload_date": datetime.now(UTC),
                    "play_count": 0,
                    "source": "local",
                },
            ]
            await database.tracks.insert_many(sample_tracks)
            logger.info(f"Seeded {len(sample_tracks)} sample tracks")
    except Exception as exc:
        logger.warning(f"Startup task failed: {exc}")

    logger.info("Resonance API ready")
    yield

    # ----- shutdown -----
    logger.info("Shutting down Resonance API …")
    from database import client
    if client is not None:
        client.close()
    logger.info("Shutdown complete")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(title="Resonance Music Player API", version="2.0.0", lifespan=lifespan)

# CORS — must be added before routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Path traversal guard
@app.middleware("http")
async def block_path_traversal(request: Request, call_next):
    raw = request.scope.get("raw_path", b"")
    raw_str = raw.decode("latin-1") if isinstance(raw, (bytes, bytearray)) else str(raw)
    if ".." in raw_str or ".." in unquote(raw_str) or ".." in request.url.path:
        return JSONResponse({"detail": "Invalid path"}, status_code=400)
    return await call_next(request)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
api_router = APIRouter(prefix="/api")
api_router.include_router(tracks.router)
api_router.include_router(youtube.router)
api_router.include_router(artwork.router)
api_router.include_router(playlists.router)
api_router.include_router(favorites.router)
api_router.include_router(recommendations.router)
api_router.include_router(search.router)
api_router.include_router(enrichment.router)

@api_router.get("/")
async def root():
    return {"message": "Resonance Music Player API", "version": "2.0.0"}

@api_router.get("/health")
async def health():
    return {"status": "ok"}

app.include_router(api_router)


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("BACKEND_PORT", os.environ.get("PORT", 8001)))
    logger.info(f"Starting server on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
