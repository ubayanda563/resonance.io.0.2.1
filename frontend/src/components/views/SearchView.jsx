import React, { useState, useEffect, memo } from 'react';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { searchAPI } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import { usePlayer } from '../../contexts/PlayerContext';
import { useFavoritesContext } from '../../contexts/FavoritesContext';
import TrackCard from '../TrackCard';

const SearchView = memo(() => {
  const { playTrack, addToQueue } = usePlayer();
  const { isFavorite, toggleFavorite } = useFavoritesContext();

  const [query,          setQuery]          = useState('');
  const [trackResults,   setTrackResults]   = useState([]);
  const [artistResults,  setArtistResults]  = useState([]);
  const [history,        setHistory]        = useState([]);
  const [loading,        setLoading]        = useState(false);

  // Fix #4 — single 300ms debounce, one place
  const debouncedQuery = useDebounce(query, 300);

  // Load history on mount
  useEffect(() => {
    searchAPI.getSearchHistory(10)
      .then(h => { if (h) setHistory(h.map(i => i.query)); })
      .catch(() => {});
  }, []);

  // Fire searches — fix #16: AbortController baked into api.js
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setTrackResults([]);
      setArtistResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      searchAPI.searchTracks(debouncedQuery, 20),
      searchAPI.searchArtists(debouncedQuery),
    ])
      .then(([tracks, artists]) => {
        setTrackResults(tracks  || []);
        setArtistResults(artists || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [debouncedQuery]);

  const clearSearch = () => {
    setQuery('');
    setTrackResults([]);
    setArtistResults([]);
  };

  const useHistoryItem = (q) => setQuery(q);

  const deleteHistory = async (q) => {
    setHistory(prev => prev.filter(h => h !== q));
    await searchAPI.deleteSearchHistoryItem(q).catch(() => {});
  };

  const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00';
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  };

  const hasResults = trackResults.length > 0 || artistResults.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Search bar */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#55555E] pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search tracks, artists, albums…"
          className="glass-input w-full pl-11 pr-10 py-3 text-sm rounded-2xl"
          autoFocus
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#55555E] hover:text-[#EBEBED] transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Loading shimmer */}
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden">
              <div className="aspect-square skeleton" />
              <div className="p-3 glass-dark space-y-2">
                <div className="h-3 skeleton rounded w-3/4" />
                <div className="h-2 skeleton rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state — show history */}
      {!query && !loading && (
        <div className="space-y-6">
          {history.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-[#888890]">
                  <Clock size={14} />
                  <span className="text-xs uppercase tracking-[0.4em]">Recent Searches</span>
                </div>
                <button
                  onClick={() => { setHistory([]); searchAPI.clearSearchHistory().catch(() => {}); }}
                  className="text-xs text-[#3D3D45] hover:text-[#CC2020] transition-colors"
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {history.map(h => (
                  <div key={h} className="flex items-center gap-1 glass-dark-sm rounded-full px-3 py-1.5">
                    <button onClick={() => useHistoryItem(h)} className="text-xs text-[#C8C8CC]">{h}</button>
                    <button onClick={() => deleteHistory(h)} className="text-[#3D3D45] hover:text-[#CC2020] ml-1">
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 text-[#888890] mb-3">
              <TrendingUp size={14} />
              <span className="text-xs uppercase tracking-[0.4em]">Browse Genres</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['Hip-Hop', 'Electronic', 'R&B', 'Rock', 'Jazz', 'Classical', 'Pop', 'Afrobeats', 'Amapiano'].map((genre, i) => {
                const colors = ['#CC2020', '#C49A28', '#888890', '#3A3A44', '#8B6B1A', '#55555E', '#CC2020', '#C49A28', '#888890'];
                return (
                  <button
                    key={genre}
                    onClick={() => setQuery(genre)}
                    className="rounded-2xl p-4 text-left font-medium text-sm text-[#EBEBED] h-16 flex items-end transition hover:scale-[1.02]"
                    style={{ background: `linear-gradient(135deg, ${colors[i]}88, ${colors[i]}44)`, border: `1px solid ${colors[i]}33` }}
                  >
                    {genre}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && hasResults && (
        <div className="space-y-6">
          {artistResults.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-[#888890] mb-3">Artists</p>
              <div className="flex flex-wrap gap-3">
                {artistResults.slice(0, 6).map(a => (
                  <button
                    key={a.artist}
                    onClick={() => setQuery(a.artist)}
                    className="flex items-center gap-3 glass-dark-sm rounded-2xl px-4 py-2.5 hover:glass-dark transition-all"
                  >
                    {a.sample_artwork
                      ? <img src={a.sample_artwork} alt={a.artist} className="w-8 h-8 rounded-full object-cover" />
                      : <div className="w-8 h-8 rounded-full bg-[#1C1D26] flex items-center justify-center text-xs text-[#888890]">{a.artist?.[0]}</div>
                    }
                    <div className="text-left">
                      <p className="text-xs font-medium text-[#EBEBED]">{a.artist}</p>
                      <p className="text-[10px] text-[#3D3D45]">{a.track_count} tracks</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {trackResults.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-[#888890] mb-3">
                Tracks · {trackResults.length} results
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {trackResults.map(track => (
                  <TrackCard
                    key={track.id || track._id}
                    track={track}
                    onPlay={(t) => playTrack(t, trackResults)}
                    onFavorite={toggleFavorite}
                    onAddToQueue={addToQueue}
                    isFavorite={isFavorite}
                    formatTime={formatTime}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No results */}
      {!loading && query && !hasResults && debouncedQuery === query && (
        <div className="text-center py-16">
          <Search size={32} className="mx-auto text-[#3D3D45] mb-3" />
          <p className="text-[#888890]">No results for "{query}"</p>
          <p className="text-[#3D3D45] text-sm mt-1">Try a different search</p>
        </div>
      )}
    </div>
  );
});

SearchView.displayName = 'SearchView';
export default SearchView;
