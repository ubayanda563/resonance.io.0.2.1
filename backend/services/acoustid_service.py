"""
AcoustID + AcousticBrainz Service
AcoustID: https://acoustid.org/webservice  (free, API key required — ACOUSTID_API_KEY)
Provides: audio fingerprinting — identify any song from its audio file.
Pairs with MusicBrainz for full metadata after identification.
"""
import logging
import os
import subprocess
import tempfile
import httpx

logger = logging.getLogger(__name__)

ACOUSTID_KEY  = os.environ.get("ACOUSTID_API_KEY", "")
ACOUSTID_BASE = "https://api.acoustid.org/v2"


async def fingerprint_file(file_path: str) -> dict | None:
    """
    Generate chromaprint fingerprint using fpcalc, then look up via AcoustID.
    Requires fpcalc (chromaprint) to be installed: apt install chromaprint-tools
    """
    if not ACOUSTID_KEY:
        logger.warning("ACOUSTID_API_KEY not set")
        return None
    try:
        result = subprocess.run(
            ["fpcalc", "-json", file_path],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode != 0:
            logger.warning(f"fpcalc failed: {result.stderr}")
            return None

        import json
        fp_data = json.loads(result.stdout)
        duration    = fp_data.get("duration", 0)
        fingerprint = fp_data.get("fingerprint", "")

        return await lookup_fingerprint(fingerprint, duration)
    except FileNotFoundError:
        logger.warning("fpcalc not found — install chromaprint-tools")
        return None
    except Exception as e:
        logger.warning(f"fingerprint_file error: {e}")
        return None


async def lookup_fingerprint(fingerprint: str, duration: int) -> dict | None:
    """Query AcoustID with a pre-computed fingerprint."""
    if not ACOUSTID_KEY:
        return None
    params = {
        "client":      ACOUSTID_KEY,
        "fingerprint": fingerprint,
        "duration":    int(duration),
        "meta":        "recordings+releasegroups+compress",
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(f"{ACOUSTID_BASE}/lookup", params=params)
            r.raise_for_status()
            data = r.json()

        if data.get("status") != "ok" or not data.get("results"):
            return None

        best = max(data["results"], key=lambda x: x.get("score", 0))
        recordings = best.get("recordings", [])
        if not recordings:
            return {"acoustid": best.get("id"), "score": best.get("score")}

        rec = recordings[0]
        artists = [a.get("name") for a in rec.get("artists", [])]
        rgs     = rec.get("releasegroups", [])
        release = rgs[0] if rgs else {}

        return {
            "acoustid":     best.get("id"),
            "score":        round(best.get("score", 0), 3),
            "mbid":         rec.get("id"),
            "title":        rec.get("title"),
            "artists":      artists,
            "artist":       ", ".join(artists),
            "release_group": release.get("title"),
            "release_type": release.get("type"),
            "release_year": (release.get("releases") or [{}])[0].get("date", "")[:4],
        }
    except Exception as e:
        logger.warning(f"AcoustID lookup error: {e}")
        return None
