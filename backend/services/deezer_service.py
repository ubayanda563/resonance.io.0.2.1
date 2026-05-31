"""
Deezer Service
API: https://developers.deezer.com/api
Completely free, no key required.
Provides: track search, 30s previews, album art, artist images,
          chart data, radio/genre playlists.
"""
import logging
import httpx

logger = logging.getLogger(__name__)

DEEZER_BASE = "https://api.deezer.com"


async def _get(path: str, params: dict = None) -> dict | None:
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            r = await client.get(f"{DEEZER_BASE}{path}", params=params or {})
            r.raise_for_status()
            data = r.json()
            if "error" in data:
                logger.warning(f"Deezer error {path}: {data['error']}")
                return None
            return data
    except Exception as e:
        logger.warning(f"Deezer error {path}: {e}")
        return None


def _fmt_track(t: dict) -> dict:
    return {
        "deezer_id":   t.get("id"),
        "title":       t.get("title"),
        "duration":    t.get("duration"),  # seconds
        "preview_url": t.get("preview"),   # 30-second MP3 preview
        "rank":        t.get("rank"),
        "explicit":    t.get("explicit_lyrics", False),
        "artist": {
            "id":      t.get("artist", {}).get("id"),
            "name":    t.get("artist", {}).get("name"),
            "image":   t.get("artist", {}).get("picture_medium"),
        },
        "album": {
            "id":      t.get("album", {}).get("id"),
            "title":   t.get("album", {}).get("title"),
            "cover":   t.get("album", {}).get("cover_xl") or t.get("album", {}).get("cover_big"),
        },
    }


async def search_tracks(query: str, limit: int = 10) -> list:
    data = await _get("/search/track", {"q": query, "limit": limit})
    if not data:
        return []
    return [_fmt_track(t) for t in data.get("data", [])]


async def search_artists(query: str, limit: int = 6) -> list:
    data = await _get("/search/artist", {"q": query, "limit": limit})
    if not data:
        return []
    return [
        {
            "deezer_id":    a.get("id"),
            "name":         a.get("name"),
            "image":        a.get("picture_xl") or a.get("picture_big"),
            "fan_count":    a.get("nb_fan"),
            "album_count":  a.get("nb_album"),
            "deezer_url":   a.get("link"),
        }
        for a in data.get("data", [])
    ]


async def get_artist(deezer_id: int) -> dict | None:
    data = await _get(f"/artist/{deezer_id}")
    if not data:
        return None
    return {
        "deezer_id":   data.get("id"),
        "name":        data.get("name"),
        "image":       data.get("picture_xl") or data.get("picture_big"),
        "fan_count":   data.get("nb_fan"),
        "album_count": data.get("nb_album"),
        "deezer_url":  data.get("link"),
    }


async def get_artist_top_tracks(deezer_id: int, limit: int = 10) -> list:
    data = await _get(f"/artist/{deezer_id}/top", {"limit": limit})
    if not data:
        return []
    return [_fmt_track(t) for t in data.get("data", [])]


async def get_album(deezer_id: int) -> dict | None:
    data = await _get(f"/album/{deezer_id}")
    if not data:
        return None
    return {
        "deezer_id":    data.get("id"),
        "title":        data.get("title"),
        "cover":        data.get("cover_xl") or data.get("cover_big"),
        "release_date": data.get("release_date"),
        "genre":        data.get("genres", {}).get("data", [{}])[0].get("name"),
        "tracks": [_fmt_track(t) for t in data.get("tracks", {}).get("data", [])],
    }


async def get_chart(genre_id: int = 0, limit: int = 20) -> dict:
    """
    Get top charts. genre_id=0 for global.
    Common genre IDs: 0=All, 132=Pop, 116=Rap/Hip-Hop, 152=Rock,
    113=Dance, 165=R&B, 106=Electro, 98=Jazz, 129=Soul&Funk
    """
    data = await _get(f"/chart/{genre_id}", {"limit": limit})
    if not data:
        return {}
    return {
        "tracks":  [_fmt_track(t)  for t in data.get("tracks",  {}).get("data", [])],
        "artists": [
            {
                "deezer_id": a.get("id"),
                "name":      a.get("name"),
                "image":     a.get("picture_medium"),
                "position":  a.get("position"),
            }
            for a in data.get("artists", {}).get("data", [])
        ],
        "albums": [
            {
                "deezer_id":  al.get("id"),
                "title":      al.get("title"),
                "cover":      al.get("cover_medium"),
                "artist":     al.get("artist", {}).get("name"),
                "position":   al.get("position"),
            }
            for al in data.get("albums", {}).get("data", [])
        ],
    }


async def get_radio_tracks(genre_id: int = 0, limit: int = 25) -> list:
    """Get editorial radio tracks for a genre."""
    data = await _get(f"/radio/{genre_id}/tracks", {"limit": limit})
    if not data:
        return []
    return [_fmt_track(t) for t in data.get("data", [])]


async def get_genres() -> list:
    data = await _get("/genre")
    if not data:
        return []
    return [
        {"id": g.get("id"), "name": g.get("name"), "image": g.get("picture_medium")}
        for g in data.get("data", [])
    ]
