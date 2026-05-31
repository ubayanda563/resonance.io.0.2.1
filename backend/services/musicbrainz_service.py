"""
MusicBrainz Service
API: https://musicbrainz.org/doc/MusicBrainz_API
Free, no key required. Rate limit: 1 req/sec.
Provides: artist info, releases, genres, ISRC, full music knowledge graph.
"""
import asyncio
import logging
import httpx

logger = logging.getLogger(__name__)

MB_BASE    = "https://musicbrainz.org/ws/2"
COVER_BASE = "https://coverartarchive.org"
HEADERS    = {"User-Agent": "Resonance/2.0 (https://github.com/ubayanda563/resonance.io.0.2.1)"}

_last_request = 0.0
_RATE_LIMIT   = 1.1  # seconds between requests


async def _get(path: str, params: dict = None) -> dict | None:
    global _last_request
    import time
    wait = _RATE_LIMIT - (time.time() - _last_request)
    if wait > 0:
        await asyncio.sleep(wait)
    _last_request = time.time()

    url = f"{MB_BASE}{path}"
    default_params = {"fmt": "json"}
    if params:
        default_params.update(params)
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            r = await client.get(url, params=default_params, headers=HEADERS)
            r.raise_for_status()
            return r.json()
    except Exception as e:
        logger.warning(f"MusicBrainz error {path}: {e}")
        return None


async def search_artist(name: str) -> dict | None:
    """Search for an artist and return the best match with full details."""
    data = await _get("/artist", {"query": f'artist:"{name}"', "limit": 1})
    if not data or not data.get("artists"):
        return None
    artist = data["artists"][0]
    mbid = artist.get("id")
    if mbid:
        detail = await _get(f"/artist/{mbid}", {
            "inc": "releases+release-groups+tags+ratings+url-rels"
        })
        if detail:
            return _format_artist(detail)
    return _format_artist(artist)


def _format_artist(a: dict) -> dict:
    tags = [t["name"] for t in a.get("tags", []) if t.get("count", 0) > 0]
    urls = {}
    for rel in a.get("relations", []) or []:
        rtype = rel.get("type", "")
        url   = rel.get("url", {}).get("resource", "")
        if "wikipedia" in url:    urls["wikipedia"]  = url
        elif "discogs" in url:    urls["discogs"]     = url
        elif "spotify" in url:    urls["spotify"]     = url
        elif "allmusic" in url:   urls["allmusic"]    = url
        elif "instagram" in url:  urls["instagram"]   = url
        elif "twitter" in url:    urls["twitter"]     = url

    releases = []
    for rg in (a.get("release-groups") or [])[:10]:
        releases.append({
            "title":    rg.get("title"),
            "type":     rg.get("primary-type"),
            "year":     (rg.get("first-release-date") or "")[:4],
            "mbid":     rg.get("id"),
        })

    return {
        "mbid":       a.get("id"),
        "name":       a.get("name"),
        "country":    a.get("country"),
        "type":       a.get("type"),
        "begin_year": (a.get("life-span") or {}).get("begin", "")[:4],
        "end_year":   (a.get("life-span") or {}).get("end", "")[:4],
        "disambiguation": a.get("disambiguation"),
        "genres":     tags[:10],
        "releases":   releases,
        "urls":       urls,
        "score":      a.get("score"),
    }


async def search_track(title: str, artist: str = None) -> dict | None:
    """Search for a recording and return metadata including ISRC."""
    q = f'recording:"{title}"'
    if artist:
        q += f' AND artist:"{artist}"'
    data = await _get("/recording", {"query": q, "limit": 1, "inc": "isrcs+artists+releases"})
    if not data or not data.get("recordings"):
        return None
    rec = data["recordings"][0]
    return {
        "mbid":    rec.get("id"),
        "title":   rec.get("title"),
        "length":  rec.get("length"),  # ms
        "isrcs":   rec.get("isrcs", []),
        "artists": [c.get("artist", {}).get("name") for c in rec.get("artist-credit", [])],
        "release": (rec.get("releases") or [{}])[0].get("title"),
        "score":   rec.get("score"),
    }


async def get_album_art(mbid: str, size: str = "large") -> str | None:
    """Get cover art URL from the Cover Art Archive for a release-group MBID."""
    try:
        async with httpx.AsyncClient(timeout=6) as client:
            r = await client.get(f"{COVER_BASE}/release-group/{mbid}", headers=HEADERS)
            if r.status_code == 200:
                data = r.json()
                images = data.get("images", [])
                for img in images:
                    if img.get("front"):
                        return img.get("thumbnails", {}).get(size) or img.get("image")
                if images:
                    return images[0].get("image")
    except Exception as e:
        logger.warning(f"Cover art error {mbid}: {e}")
    return None
