import React, { useState, memo, useEffect } from 'react';
import { Youtube, Search, Play, Plus, Loader2 } from 'lucide-react';
import { youtubeAPI } from '../../services/api';
import { usePlayer } from '../../contexts/PlayerContext';
import { useDebounce } from '../../hooks/useDebounce';

const YouTubeView = memo(() => {
  const { playTrack, addToQueue } = usePlayer();
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    if (!debouncedQuery.trim()) { setResults([]); return; }
    setLoading(true);
    youtubeAPI.search(debouncedQuery, 12)
      .then(r => { setResults(r || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [debouncedQuery]);

  const formatTime = (s) => {
    if (!s) return '';
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  };

  const handlePlay = async (result) => {
    try {
      const track = await youtubeAPI.addTrack(result.id);
      if (track) playTrack(track, [track]);
    } catch {}
  };

  const handleQueue = async (result) => {
    try {
      const track = await youtubeAPI.addTrack(result.id);
      if (track) addToQueue(track);
    } catch {}
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Youtube size={22} className="text-[#CC2020]" />
        <h1 className="text-2xl font-semibold text-[#EBEBED]">YouTube</h1>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#55555E]" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search YouTube music…"
          className="glass-input w-full pl-11 pr-4 py-3 text-sm rounded-2xl"
          autoFocus
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={22} className="animate-spin text-[#C49A28]" />
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {results.map(r => (
            <div key={r.id} className="glass-dark-sm rounded-2xl p-3 flex items-center gap-3 hover:glass-dark transition-all group">
              <div className="relative flex-shrink-0">
                <img src={r.thumbnail} alt={r.title} className="w-16 h-16 rounded-xl object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-xl flex items-center justify-center">
                  <Play size={20} className="text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#EBEBED] font-medium truncate">{r.title}</p>
                <p className="text-xs text-[#3D3D45] truncate">{r.artist}</p>
                <p className="text-xs text-[#55555E] mt-0.5">{formatTime(r.duration)}</p>
              </div>
              <div className="flex flex-col gap-1 flex-shrink-0">
                <button onClick={() => handlePlay(r)} className="btn-play rounded-lg px-3 py-1.5 text-xs text-[#030306]">Play</button>
                <button onClick={() => handleQueue(r)} className="glass-button-dark rounded-lg px-3 py-1.5 text-xs text-[#888890]">+ Queue</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && query && results.length === 0 && debouncedQuery === query && (
        <div className="text-center py-10">
          <p className="text-[#888890] text-sm">No results for "{query}"</p>
        </div>
      )}
    </div>
  );
});

YouTubeView.displayName = 'YouTubeView';
export default YouTubeView;
