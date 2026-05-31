import React, { useState, useEffect, useCallback, memo } from 'react';
import { Upload, Grid, List, Loader2 } from 'lucide-react';
import { trackAPI } from '../../services/api';
import { usePlayer } from '../../contexts/PlayerContext';
import { useFavoritesContext } from '../../contexts/FavoritesContext';
import LibraryTrackVirtualList from '../LibraryTrackVirtualList';
import TrackCard from '../TrackCard';

/**
 * LibraryView — uses cursor/page-based loading (fix #5) instead of 200-track fetch.
 */
const PAGE_SIZE = 50;

const LibraryView = memo(({ onAddToPlaylist }) => {
  const { playTrack, addToQueue } = usePlayer();
  const { isFavorite, toggleFavorite } = useFavoritesContext();

  const [tracks,   setTracks]   = useState([]);
  const [offset,   setOffset]   = useState(0);
  const [hasMore,  setHasMore]  = useState(true);
  const [loading,  setLoading]  = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [sortBy,   setSortBy]   = useState('upload_date');
  const [sortOrder,setSortOrder]= useState('desc');

  const loadTracks = useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);
    const off = reset ? 0 : offset;
    try {
      const data = await trackAPI.getTracks({
        limit: PAGE_SIZE, offset: off, sort_by: sortBy, sort_order: sortOrder,
      });
      const list = data || [];
      setTracks(prev => reset ? list : [...prev, ...list]);
      setOffset(off + list.length);
      setHasMore(list.length === PAGE_SIZE);
    } catch (e) {
      console.error('LibraryView load error:', e);
    } finally {
      setLoading(false);
    }
  }, [offset, loading, sortBy, sortOrder]);

  // Reload when sort changes
  useEffect(() => {
    setTracks([]);
    setOffset(0);
    setHasMore(true);
    loadTracks(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, sortOrder]);

  const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00';
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold text-[#EBEBED]">Library</h1>

        <div className="flex items-center gap-2">
          {/* Sort */}
          <select
            value={`${sortBy}_${sortOrder}`}
            onChange={e => {
              const [sb, so] = e.target.value.split('_');
              setSortBy(sb); setSortOrder(so);
            }}
            className="glass-input text-xs rounded-xl px-3 py-1.5 bg-transparent"
          >
            <option value="upload_date_desc">Newest first</option>
            <option value="upload_date_asc">Oldest first</option>
            <option value="title_asc">A → Z</option>
            <option value="title_desc">Z → A</option>
            <option value="artist_asc">Artist A → Z</option>
            <option value="play_count_desc">Most played</option>
          </select>

          {/* View toggle */}
          <button
            onClick={() => setViewMode(v => v === 'list' ? 'grid' : 'list')}
            className="glass-button rounded-xl p-2"
          >
            {viewMode === 'list' ? <Grid size={15} /> : <List size={15} />}
          </button>
        </div>
      </div>

      {/* Track count */}
      <p className="text-xs text-[#3D3D45]">{tracks.length}{hasMore ? '+' : ''} tracks</p>

      {/* Upload prompt */}
      {tracks.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 glass-dark-sm rounded-3xl">
          <Upload size={40} className="text-[#3D3D45]" />
          <p className="text-[#888890]">No tracks in your library</p>
          <p className="text-[#3D3D45] text-sm">Upload audio files to get started</p>
        </div>
      )}

      {/* Virtual list */}
      {tracks.length > 0 && viewMode === 'list' && (
        <LibraryTrackVirtualList
          tracks={tracks}
          onPlay={(t) => playTrack(t, tracks)}
          onFavorite={toggleFavorite}
          onAddToPlaylist={onAddToPlaylist}
        />
      )}

      {/* Grid view */}
      {tracks.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {tracks.map(track => (
            <TrackCard
              key={track.id || track._id}
              track={track}
              onPlay={(t) => playTrack(t, tracks)}
              onFavorite={toggleFavorite}
              onAddToQueue={addToQueue}
              onAddToPlaylist={onAddToPlaylist}
              isFavorite={isFavorite}
              formatTime={formatTime}
            />
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && tracks.length > 0 && (
        <button
          onClick={() => loadTracks()}
          disabled={loading}
          className="glass-button rounded-2xl py-3 text-sm text-[#888890] w-full flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 size={14} className="animate-spin" /> Loading…</> : 'Load more'}
        </button>
      )}

      {loading && tracks.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[#C49A28]" />
        </div>
      )}
    </div>
  );
});

LibraryView.displayName = 'LibraryView';
export default LibraryView;
