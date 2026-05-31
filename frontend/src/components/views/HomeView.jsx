import React, { useState, useEffect, memo, useCallback } from 'react';
import { Play } from 'lucide-react';
import { trackAPI, recommendationsAPI } from '../../services/api';
import { usePlayer } from '../../contexts/PlayerContext';
import { useFavoritesContext } from '../../contexts/FavoritesContext';
import TrackCard from '../TrackCard';

const HomeView = memo(() => {
  const { playTrack, addToQueue, formatTime, currentTrack, isPlaying } = usePlayer();
  const { isFavorite, toggleFavorite } = useFavoritesContext();

  const [recentTracks,   setRecentTracks]   = useState([]);
  const [trendingTracks, setTrendingTracks] = useState([]);
  const [loading,        setLoading]        = useState(true);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    // Fix #5 — load 20 recent + 10 trending instead of 200 tracks upfront
    Promise.all([
      trackAPI.getRecentTracks(20),
      recommendationsAPI.getTrending(10),
    ]).then(([recent, trending]) => {
      if (!cancelled) {
        setRecentTracks(recent   || []);
        setTrendingTracks(trending || []);
        setLoading(false);
      }
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const formatTime = useCallback((s) => {
    if (!s || isNaN(s)) return '0:00';
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  }, []);

  const skeletonCard = (
    <div className="rounded-2xl overflow-hidden glass-dark">
      <div className="aspect-square skeleton" />
      <div className="p-3 space-y-2">
        <div className="h-3 skeleton rounded w-3/4" />
        <div className="h-2 skeleton rounded w-1/2" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
      {/* Hero */}
      <div>
        <p className="text-xs uppercase tracking-[0.5em] text-[#3D3D45] mb-2">{greeting}</p>
        <h1 className="text-4xl md:text-5xl font-semibold text-[#EBEBED] tracking-tight leading-tight">
          Your music,<br />your mood.
        </h1>
        <p className="text-[#3D3D45] mt-3 text-sm">Stream your library and manage playlists.</p>
      </div>

      {/* Now Playing teaser */}
      {currentTrack && (
        <div className="glass-card-dark rounded-2xl p-4 flex items-center gap-4">
          <img src={currentTrack.artwork_url} alt={currentTrack.title} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[9px] uppercase tracking-[0.5em] text-[#3D3D45] mb-1">Now Playing</p>
            <p className="text-[#EBEBED] font-semibold truncate">{currentTrack.title}</p>
            <p className="text-[#888890] text-sm truncate">{currentTrack.artist}</p>
          </div>
          {isPlaying && (
            <div className="flex items-end gap-0.5 h-5 flex-shrink-0">
              {[3, 5, 4, 6, 3].map((h, i) => (
                <div key={i} className="w-1 bg-[#C49A28] rounded-full animate-pulse" style={{ height: h * 3, animationDelay: `${i * 120}ms` }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recently Added */}
      <div>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#EBEBED]">Recently Added</h2>
          <span className="text-xs text-[#55555E]">{recentTracks.length} tracks</span>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <React.Fragment key={i}>{skeletonCard}</React.Fragment>)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recentTracks.slice(0, 8).map(track => (
              <TrackCard
                key={track.id || track._id}
                track={track}
                onPlay={(t) => playTrack(t, recentTracks)}
                onFavorite={toggleFavorite}
                onAddToQueue={addToQueue}
                isFavorite={isFavorite}
                formatTime={formatTime}
              />
            ))}
          </div>
        )}
      </div>

      {/* Trending */}
      {(loading || trendingTracks.length > 0) && (
        <div>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#EBEBED]">Most Played</h2>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <React.Fragment key={i}>{skeletonCard}</React.Fragment>)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {trendingTracks.map(track => (
                <TrackCard
                  key={track.id || track._id}
                  track={track}
                  onPlay={(t) => playTrack(t, trendingTracks)}
                  onFavorite={toggleFavorite}
                  onAddToQueue={addToQueue}
                  isFavorite={isFavorite}
                  formatTime={formatTime}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

HomeView.displayName = 'HomeView';
export default HomeView;
