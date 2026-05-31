"""
/api/enrichment — Aggregated music enrichment endpoints.
Calls MusicBrainz + Last.fm + Deezer in parallel for a single rich response.
"""
import asyncio
import logging
from fastapi import APIRouter, Depends, HTTPException, Query

from services.musicbrainz_service import (
    search_artist as mb_artist,
    search_track  as mb_track,
    get_album_art as mb_album_art,
)
from services.lastfm_service import (
    get_artist_info       as lfm_artist_info,
    get_similar_artists   as lfm_similar_artists,
    get_artist_top_tracks as lfm_artist_top_tracks,
    get_artist_top_albums as lfm_artist_top_albums,
    get_track_info        as lfm_track_info,
    get_similar_tracks    as lfm_similar_tracks,
    get_top_charts        as lfm_top_charts,
)
from services.deezer_service import (
    search_tracks   as dz_search_tracks,
    search_artists  as dz_search_artists,
    get_chart       as dz_chart,
    get_genres      as dz_genres,
    get_radio_tracks as dz_radio,
)
from services.openwhyd_service import get_lyrics, search_lyrics
from services.shazam_service import (
    get_trending            as shazam_trending,
    get_trending_by_genre   as shazam_genre,
    search_songs            as shazam_search,
)
from database import get_database
from utils import serialize_doc

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/enrichment", tags=["enrichment"])


# ── Artist Profile ─────────────────────────────────────────────────────────────
@router.get("/artist/{artist_name}")
async def get_artist_profile(artist_name: str):
    """
    Aggregate artist info from MusicBrainz + Last.fm + Deezer in parallel.
    Returns bio, similar artists, top tracks, top albums, images, and social links.
    """
    mb, lfm, dz_list = await asyncio.gather(
        mb_artist(artist_name),
        lfm_artist_info(artist_name),
        dz_search_artists(artist_name, limit=1),
        return_exceptions=True,
    )
    if isinstance(mb,     Exception): mb      = None
    if isinstance(lfm,    Exception): lfm     = None
    if isinstance(dz_list,Exception): dz_list = []

    dz = dz_list[0] if dz_list else {}

    if not mb and not lfm and not dz:
        raise HTTPException(status_code=404, detail="Artist not found")

    # Merge — Last.fm bio + MusicBrainz metadata + Deezer image
    name = (lfm or {}).get("name") or (mb or {}).get("name") or artist_name
    return {
        "name":         name,
        "mbid":         (mb  or {}).get("mbid")     or (lfm or {}).get("mbid"),
        "deezer_id":    dz.get("deezer_id"),
        "bio":          (lfm or {}).get("bio"),
        "image":        dz.get("image") or (lfm or {}).get("image"),
        "genres":       (mb  or {}).get("genres",  []) or (lfm or {}).get("tags", []),
        "listeners":    (lfm or {}).get("listeners"),
        "play_count":   (lfm or {}).get("play_count"),
        "fan_count":    dz.get("fan_count"),
        "country":      (mb  or {}).get("country"),
        "begin_year":   (mb  or {}).get("begin_year"),
        "similar":      (lfm or {}).get("similar", []),
        "urls":         (mb  or {}).get("urls",    {}),
        "discography":  (mb  or {}).get("releases", []),
    }


@router.get("/artist/{artist_name}/top-tracks")
async def get_artist_top_tracks(
    artist_name: str,
    limit: int = Query(10, ge=1, le=50),
):
    lfm, dz_list = await asyncio.gather(
        lfm_artist_top_tracks(artist_name, limit),
        dz_search_artists(artist_name, limit=1),
        return_exceptions=True,
    )
    if isinstance(lfm,    Exception): lfm     = []
    if isinstance(dz_list,Exception): dz_list = []

    # Try Deezer top tracks if we have deezer_id
    dz_tracks = []
    if dz_list and not isinstance(dz_list, Exception) and dz_list:
        from services.deezer_service import get_artist_top_tracks as dz_top
        try:
            dz_tracks = await dz_top(dz_list[0]["deezer_id"], limit) or []
        except Exception:
            pass

    # Merge: prefer Deezer (has 30s preview) then Last.fm
    seen = set()
    merged = []
    for t in dz_tracks:
        key = (t.get("title") or "").lower()
        if key not in seen:
            seen.add(key)
            merged.append({**t, "source": "deezer"})
    for t in (lfm or []):
        key = (t.get("name") or "").lower()
        if key not in seen:
            seen.add(key)
            merged.append({**t, "source": "lastfm"})

    return merged[:limit]


@router.get("/artist/{artist_name}/similar")
async def get_similar_artists(artist_name: str, limit: int = Query(8, ge=1, le=20)):
    similar = await lfm_similar_artists(artist_name, limit)
    return similar or []


# ── Track Enrichment ───────────────────────────────────────────────────────────
@router.get("/track")
async def get_track_enrichment(
    title:  str = Query(...),
    artist: str = Query(...),
):
    """
    Enrich a track with metadata from Last.fm + MusicBrainz + Deezer.
    Returns: tags, play count, similar tracks, Deezer preview URL.
    """
    lfm_info, mb_rec, dz_results = await asyncio.gather(
        lfm_track_info(title, artist),
        mb_track(title, artist),
        dz_search_tracks(f"{title} {artist}", limit=1),
        return_exceptions=True,
    )
    if isinstance(lfm_info,   Exception): lfm_info   = None
    if isinstance(mb_rec,     Exception): mb_rec     = None
    if isinstance(dz_results, Exception): dz_results = []

    dz = dz_results[0] if dz_results else {}

    return {
        "title":         title,
        "artist":        artist,
        "tags":          (lfm_info or {}).get("tags", []),
        "play_count":    (lfm_info or {}).get("play_count"),
        "listeners":     (lfm_info or {}).get("listeners"),
        "album":         (lfm_info or {}).get("album") or dz.get("album", {}).get("title"),
        "album_art":     (lfm_info or {}).get("album_art") or dz.get("album", {}).get("cover"),
        "preview_url":   dz.get("preview_url"),  # 30-second preview
        "duration_ms":   (lfm_info or {}).get("duration_ms") or ((mb_rec or {}).get("length")),
        "isrcs":         (mb_rec  or {}).get("isrcs", []),
        "mbid":          (mb_rec  or {}).get("mbid"),
        "lastfm_url":    (lfm_info or {}).get("url"),
        "wiki":          (lfm_info or {}).get("wiki"),
        "deezer_id":     dz.get("deezer_id"),
        "deezer_rank":   dz.get("rank"),
        "explicit":      dz.get("explicit", False),
    }


@router.get("/track/similar")
async def get_similar_tracks(
    title:  str = Query(...),
    artist: str = Query(...),
    limit:  int = Query(8, ge=1, le=20),
):
    similar = await lfm_similar_tracks(title, artist, limit)
    return similar or []


# ── Lyrics ─────────────────────────────────────────────────────────────────────
@router.get("/lyrics")
async def get_track_lyrics(
    title:    str = Query(...),
    artist:   str = Query(...),
    album:    str = Query(None),
    duration: int = Query(None),
):
    lyrics = await get_lyrics(title, artist, album, duration)
    if not lyrics:
        raise HTTPException(status_code=404, detail="Lyrics not found")
    return lyrics


@router.get("/lyrics/search")
async def search_track_lyrics(
    q:     str = Query(..., min_length=1),
    limit: int = Query(5, ge=1, le=20),
):
    return await search_lyrics(q, limit)


# ── Charts & Discovery ─────────────────────────────────────────────────────────
@router.get("/charts/global")
async def get_global_charts(limit: int = Query(20, ge=1, le=50)):
    """Top tracks from Last.fm global charts + Deezer global charts."""
    lfm_tracks, dz_chart_data = await asyncio.gather(
        lfm_top_charts("tracks", limit),
        dz_chart(0, limit),
        return_exceptions=True,
    )
    if isinstance(lfm_tracks,    Exception): lfm_tracks    = []
    if isinstance(dz_chart_data, Exception): dz_chart_data = {}

    return {
        "lastfm":  lfm_tracks or [],
        "deezer":  (dz_chart_data or {}).get("tracks", []),
    }


@router.get("/charts/trending")
async def get_trending_tracks(
    country: str = Query("US"),
    limit:   int = Query(20, ge=1, le=50),
):
    """Trending tracks from Shazam by country."""
    try:
        return await shazam_trending(country, limit)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/charts/genre/{genre}")
async def get_genre_chart(genre: str, limit: int = Query(20, ge=1, le=50)):
    """
    Genre charts from Shazam.
    Valid genres: pop, hip-hop-rap, dance, electronic, soul-rnb,
                  alternative, rock, latin, afro-beats, k-pop, house
    """
    data = await shazam_genre(genre, limit)
    return data or []


@router.get("/discovery/genres")
async def get_deezer_genres():
    """All available Deezer genres with images."""
    return await dz_genres() or []


@router.get("/discovery/radio/{genre_id}")
async def get_genre_radio(genre_id: int, limit: int = Query(25, ge=1, le=50)):
    """Deezer radio stream for a genre — returns 30s preview tracks."""
    return await dz_radio(genre_id, limit) or []


# ── Search (cross-source) ──────────────────────────────────────────────────────
@router.get("/search")
async def cross_search(
    q:     str = Query(..., min_length=1, max_length=200),
    limit: int = Query(10, ge=1, le=30),
):
    """
    Search tracks across Deezer + Shazam simultaneously.
    Returns merged results with 30s previews where available.
    """
    dz, shazam = await asyncio.gather(
        dz_search_tracks(q, limit),
        shazam_search(q, limit),
        return_exceptions=True,
    )
    if isinstance(dz,     Exception): dz     = []
    if isinstance(shazam, Exception): shazam = []

    seen   = set()
    merged = []
    for t in (dz or []):
        key = f"{(t.get('title') or '').lower()}::{(t.get('artist') or {}).get('name', '').lower()}"
        if key not in seen:
            seen.add(key)
            merged.append({**t, "source": "deezer"})
    for t in (shazam or []):
        key = f"{(t.get('title') or '').lower()}::{(t.get('subtitle') or '').lower()}"
        if key not in seen:
            seen.add(key)
            merged.append({**t, "source": "shazam"})

    return merged[:limit]


# ── Auto-tag track on upload ───────────────────────────────────────────────────
@router.post("/auto-tag/{track_id}")
async def auto_tag_track(track_id: str, db=Depends(get_database)):
    """
    After a local file upload, enrich it with metadata from external APIs.
    Updates the track document in MongoDB with genre, album art, tags.
    """
    from bson import ObjectId
    if not ObjectId.is_valid(track_id):
        raise HTTPException(status_code=400, detail="Invalid track ID")

    track = await db.tracks.find_one({"_id": ObjectId(track_id)})
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    title  = track.get("title", "")
    artist = track.get("artist", "")

    lfm, dz, mb = await asyncio.gather(
        lfm_track_info(title, artist),
        dz_search_tracks(f"{title} {artist}", limit=1),
        mb_track(title, artist),
        return_exceptions=True,
    )
    if isinstance(lfm, Exception): lfm = None
    if isinstance(dz,  Exception): dz  = []
    if isinstance(mb,  Exception): mb  = None

    dz_track = dz[0] if dz else {}
    updates  = {}

    # Genre from Last.fm tags
    tags = (lfm or {}).get("tags", [])
    if tags and not track.get("genre"):
        updates["genre"] = tags[0]

    # Album from Last.fm / Deezer
    if not track.get("album"):
        album = (lfm or {}).get("album") or dz_track.get("album", {}).get("title")
        if album: updates["album"] = album

    # Artwork from Deezer (higher quality than what we scrape)
    if dz_track.get("album", {}).get("cover"):
        updates["artwork_url"] = dz_track["album"]["cover"]

    # Deezer preview URL stored for 30s streaming fallback
    if dz_track.get("preview_url"):
        updates["preview_url"] = dz_track["preview_url"]

    # ISRC from MusicBrainz
    isrcs = (mb or {}).get("isrcs", [])
    if isrcs: updates["isrc"] = isrcs[0]

    # MBID
    if (mb or {}).get("mbid"): updates["mbid"] = mb["mbid"]

    if updates:
        await db.tracks.update_one({"_id": ObjectId(track_id)}, {"$set": updates})

    return {"updated": list(updates.keys()), "track_id": track_id}
