import React, { useState, useEffect, memo } from 'react';
import { Mic2, Loader2 } from 'lucide-react';

const fetchLyrics = async (title, artist, album, duration) => {
  const params = new URLSearchParams({ track_name: title, artist_name: artist });
  if (album)    params.append('album_name', album);
  if (duration) params.append('duration',   Math.round(duration));
  try {
    const res = await fetch(`https://lrclib.net/api/get?${params}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.plainLyrics || null;
  } catch {
    return null;
  }
};

/**
 * LyricsPanel — fetches lyrics from lrclib.net (free, no API key) (#6).
 */
const LyricsPanel = memo(({ track }) => {
  const [lyrics,  setLyrics]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    if (!track) return;
    let cancelled = false;
    setLyrics(null);
    setError(false);
    setLoading(true);
    fetchLyrics(track.title, track.artist, track.album, track.duration)
      .then(l => { if (!cancelled) { setLyrics(l); setError(!l); } })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [track?.title, track?.artist]);

  if (!track) return null;

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center gap-2 text-[#888890]">
        <Mic2 size={15} />
        <span className="text-xs uppercase tracking-[0.4em]">Lyrics</span>
      </div>

      <div className="flex-1 overflow-y-auto scroll-chrome pr-1">
        {loading && (
          <div className="flex items-center justify-center h-32">
            <Loader2 size={20} className="animate-spin text-[#C49A28]" />
          </div>
        )}
        {error && !loading && (
          <p className="text-[#3D3D45] text-sm text-center mt-8">
            Lyrics not found for this track.
          </p>
        )}
        {lyrics && !loading && (
          <pre className="text-[#C8C8CC] text-sm leading-7 whitespace-pre-wrap font-sans">
            {lyrics}
          </pre>
        )}
      </div>
    </div>
  );
});

LyricsPanel.displayName = 'LyricsPanel';
export default LyricsPanel;
