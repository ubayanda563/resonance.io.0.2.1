"""
RapidAPI Shazam Core Service
API: https://rapidapi.com/apidojo/api/shazam-core  (freemium — 500 req/month free)
Set RAPIDAPI_KEY in .env
Provides: song recognition from audio, trending charts by country, song details.
"""
import logging
import os
import base64
import httpx

logger = logging.getLogger(__name__)

RAPID_KEY    = os.environ.get("RAPIDAPI_KEY", "")
SHAZAM_HOST  = "shazam-core.p.rapidapi.com"
SHAZAM_BASE  = f"https://{SHAZAM_HOST}"

HEADERS = {
    "X-RapidAPI-Key":  RAPID_KEY,
    "X-RapidAPI-Host": SHAZAM_HOST,
}


async def _get(path: str, params: dict = None) -> dict | None:
    if not RAPID_KEY:
        logger.warning("RAPIDAPI_KEY not set — skipping Shazam call")
        return None
    try:
        async with httpx.AsyncClient(timeout=12) as client:
            r = await client.get(f"{SHAZAM_BASE}{path}", params=params or {}, headers=HEADERS)
            r.raise_for_status()
            return r.json()
    except Exception as e:
        logger.warning(f"Shazam error {path}: {e}")
        return None


def _fmt_track(t: dict) -> dict:
    share  = t.get("share", {})
    hub    = t.get("hub", {})
    images = t.get("images", {})
    return {
        "shazam_key":  t.get("key"),
        "title":       t.get("title"),
        "subtitle":    t.get("subtitle"),  # artist
        "image":       images.get("coverarthq") or images.get("coverart"),
        "genres":      t.get("genres", {}).get("primary"),
        "url":         share.get("href"),
        "apple_music": next(
            (a.get("actions", [{}])[0].get("uri") for a in hub.get("providers", [])
             if a.get("type") == "APPLEMUSIC"),
            None
        ),
    }


async def get_trending(country: str = "US", limit: int = 20) -> list:
    """Top trending tracks for a country (ISO 3166-1 alpha-2)."""
    data = await _get("/core/chart/country", {"countryCode": country, "pageSize": limit, "startFrom": 0})
    if not data:
        return []
    tracks = data.get("chart", {}).get("tracks", {}).get("hits", [])
    return [_fmt_track(h.get("track", {})) for h in tracks]


async def get_trending_by_genre(genre_id: str = "pop", limit: int = 20) -> list:
    """
    Top tracks by genre globally.
    genre_id options: pop, hip-hop-rap, dance, electronic, soul-rnb,
                      alternative, rock, latin, film-tv-stage, country,
                      afro-beats, worldwide, reggae-dance-hall, house,
                      k-pop, french-pop, singer-songwriter, regional-mexicano
    """
    data = await _get("/core/chart/genre", {"genre": genre_id, "pageSize": limit, "startFrom": 0})
    if not data:
        return []
    tracks = data.get("chart", {}).get("tracks", {}).get("hits", [])
    return [_fmt_track(h.get("track", {})) for h in tracks]


async def search_songs(query: str, limit: int = 10) -> list:
    data = await _get("/core/search/multi", {"search_type": "SONGS_ARTISTS", "query": query})
    if not data:
        return []
    hits = data.get("tracks", {}).get("hits", [])[:limit]
    return [_fmt_track(h.get("track", {})) for h in hits]


async def get_related_songs(shazam_key: str) -> list:
    data = await _get(f"/core/songs/v2/get-related", {"id": shazam_key, "locale": "en-US"})
    if not data:
        return []
    return [_fmt_track(t) for t in data.get("tracks", [])]
