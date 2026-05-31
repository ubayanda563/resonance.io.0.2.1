"""
lrclib Service (replaces lrclib stub in frontend — proper backend proxy)
API: https://lrclib.net  — completely free, no key needed
Provides: synced (LRC) + plain lyrics for any track.
Proxying through backend avoids CORS on some clients.
"""
import logging
import httpx

logger = logging.getLogger(__name__)
LRCLIB_BASE = "https://lrclib.net/api"


async def get_lyrics(title: str, artist: str, album: str = None, duration: int = None) -> dict | None:
    params = {"track_name": title, "artist_name": artist}
    if album:    params["album_name"]  = album
    if duration: params["duration"]    = int(duration)
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            r = await client.get(f"{LRCLIB_BASE}/get", params=params)
            if r.status_code == 404:
                return None
            r.raise_for_status()
            data = r.json()
            return {
                "plain_lyrics":  data.get("plainLyrics"),
                "synced_lyrics": data.get("syncedLyrics"),  # LRC format with timestamps
                "has_synced":    bool(data.get("syncedLyrics")),
                "duration":      data.get("duration"),
                "instrumental":  data.get("instrumental", False),
            }
    except Exception as e:
        logger.warning(f"lrclib error {title}/{artist}: {e}")
        return None


async def search_lyrics(query: str, limit: int = 5) -> list:
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            r = await client.get(f"{LRCLIB_BASE}/search", params={"q": query})
            r.raise_for_status()
            results = r.json()
            return [
                {
                    "title":        item.get("trackName"),
                    "artist":       item.get("artistName"),
                    "album":        item.get("albumName"),
                    "duration":     item.get("duration"),
                    "has_synced":   bool(item.get("syncedLyrics")),
                    "instrumental": item.get("instrumental", False),
                }
                for item in (results[:limit] if isinstance(results, list) else [])
            ]
    except Exception as e:
        logger.warning(f"lrclib search error: {e}")
        return []
