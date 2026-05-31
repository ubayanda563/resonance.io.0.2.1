"""
Last.fm Service
API: https://www.musicxml.org/documentation/  /  https://www.last.fm/api
Free API key required — set LASTFM_API_KEY in .env
Rate limit: 5 req/sec. 
Provides: artist bio, similar artists, top tracks, top albums,
          tags/genres, global charts, track love/scrobble.
"""
import logging
import os
import httpx

logger = logging.getLogger(__name__)

LASTFM_KEY  = os.environ.get("LASTFM_API_KEY", "")
LASTFM_BASE = "https://ws.audioscrobbler.com/2.0/"


async def _call(method: str, params: dict = None) -> dict | None:
    if not LASTFM_KEY:
        logger.warning("LASTFM_API_KEY not set — skipping Last.fm call")
        return None
    p = {"method": method, "api_key": LASTFM_KEY, "format": "json"}
    if params:
        p.update(params)
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            r = await client.get(LASTFM_BASE, params=p)
            r.raise_for_status()
            data = r.json()
            if "error" in data:
                logger.warning(f"Last.fm error {method}: {data}")
                return None
            return data
    except Exception as e:
        logger.warning(f"Last.fm error {method}: {e}")
        return None


# ── Artist ─────────────────────────────────────────────────────────────────────
async def get_artist_info(artist: str) -> dict | None:
    data = await _call("artist.getinfo", {"artist": artist, "autocorrect": 1})
    if not data:
        return None
    a = data.get("artist", {})
    bio_content = a.get("bio", {}).get("content", "") or ""
    # Strip HTML tags from bio
    import re
    bio_clean = re.sub(r"<[^>]+>", "", bio_content).strip()
    return {
        "name":        a.get("name"),
        "mbid":        a.get("mbid"),
        "url":         a.get("url"),
        "image":       next((i["#text"] for i in reversed(a.get("image", [])) if i.get("#text")), None),
        "listeners":   int(a.get("stats", {}).get("listeners", 0) or 0),
        "play_count":  int(a.get("stats", {}).get("playcount", 0) or 0),
        "bio":         bio_clean[:800] if bio_clean else None,
        "tags":        [t["name"] for t in a.get("tags", {}).get("tag", [])],
        "similar":     [s["name"] for s in a.get("similar", {}).get("artist", [])],
    }


async def get_similar_artists(artist: str, limit: int = 8) -> list:
    data = await _call("artist.getsimilar", {"artist": artist, "autocorrect": 1, "limit": limit})
    if not data:
        return []
    artists = data.get("similarartists", {}).get("artist", [])
    return [
        {
            "name":  a.get("name"),
            "match": float(a.get("match", 0)),
            "image": next((i["#text"] for i in reversed(a.get("image", [])) if i.get("#text")), None),
            "url":   a.get("url"),
        }
        for a in artists
    ]


async def get_artist_top_tracks(artist: str, limit: int = 10) -> list:
    data = await _call("artist.gettoptracks", {"artist": artist, "autocorrect": 1, "limit": limit})
    if not data:
        return []
    tracks = data.get("toptracks", {}).get("track", [])
    return [
        {
            "name":       t.get("name"),
            "play_count": int(t.get("playcount", 0) or 0),
            "listeners":  int(t.get("listeners", 0) or 0),
            "url":        t.get("url"),
            "image":      next((i["#text"] for i in reversed(t.get("image", [])) if i.get("#text")), None),
        }
        for t in tracks
    ]


async def get_artist_top_albums(artist: str, limit: int = 6) -> list:
    data = await _call("artist.gettopalbums", {"artist": artist, "autocorrect": 1, "limit": limit})
    if not data:
        return []
    albums = data.get("topalbums", {}).get("album", [])
    return [
        {
            "name":      a.get("name"),
            "play_count":int(a.get("playcount", 0) or 0),
            "image":     next((i["#text"] for i in reversed(a.get("image", [])) if i.get("#text")), None),
            "url":       a.get("url"),
        }
        for a in albums
    ]


# ── Track ──────────────────────────────────────────────────────────────────────
async def get_track_info(title: str, artist: str) -> dict | None:
    data = await _call("track.getinfo", {"track": title, "artist": artist, "autocorrect": 1})
    if not data:
        return None
    t = data.get("track", {})
    return {
        "name":        t.get("name"),
        "artist":      t.get("artist", {}).get("name"),
        "album":       t.get("album", {}).get("title"),
        "album_art":   next((i["#text"] for i in reversed(t.get("album", {}).get("image", [])) if i.get("#text")), None),
        "duration_ms": int(t.get("duration", 0) or 0),
        "play_count":  int(t.get("playcount", 0) or 0),
        "listeners":   int(t.get("listeners", 0) or 0),
        "tags":        [tag["name"] for tag in t.get("toptags", {}).get("tag", [])],
        "url":         t.get("url"),
        "wiki":        (t.get("wiki") or {}).get("summary", ""),
    }


async def get_similar_tracks(title: str, artist: str, limit: int = 8) -> list:
    data = await _call("track.getsimilar", {"track": title, "artist": artist, "autocorrect": 1, "limit": limit})
    if not data:
        return []
    tracks = data.get("similartracks", {}).get("track", [])
    return [
        {
            "name":   t.get("name"),
            "artist": t.get("artist", {}).get("name"),
            "match":  float(t.get("match", 0)),
            "image":  next((i["#text"] for i in reversed(t.get("image", [])) if i.get("#text")), None),
            "url":    t.get("url"),
        }
        for t in tracks
    ]


# ── Charts ─────────────────────────────────────────────────────────────────────
async def get_top_charts(chart_type: str = "tracks", limit: int = 20) -> list:
    """chart_type: tracks | artists | tags"""
    method_map = {
        "tracks":  "chart.gettoptracks",
        "artists": "chart.gettopartists",
        "tags":    "chart.gettoptags",
    }
    method = method_map.get(chart_type, "chart.gettoptracks")
    data   = await _call(method, {"limit": limit})
    if not data:
        return []
    key = {"tracks": "tracks", "artists": "artists", "tags": "tags"}.get(chart_type, "tracks")
    inner_key = {"tracks": "track", "artists": "artist", "tags": "tag"}.get(chart_type, "track")
    items = data.get(key, {}).get(inner_key, [])
    return [
        {
            "name":       item.get("name"),
            "artist":     item.get("artist", {}).get("name") if isinstance(item.get("artist"), dict) else None,
            "play_count": int(item.get("playcount", 0) or item.get("taggings", 0) or 0),
            "listeners":  int(item.get("listeners", 0) or 0),
            "image":      next((i["#text"] for i in reversed(item.get("image", [])) if i.get("#text")), None),
            "url":        item.get("url"),
        }
        for item in items
    ]
