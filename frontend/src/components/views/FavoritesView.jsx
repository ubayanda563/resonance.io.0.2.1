import React, { useEffect, useState, memo } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { favoritesAPI } from '../../services/api';
import { usePlayer } from '../../contexts/PlayerContext';
import { useFavoritesContext } from '../../contexts/FavoritesContext';
import TrackCard from '../TrackCard';

const FavoritesView = memo(() => {
  const { playTrack, addToQueue } = usePlayer();
  const { isFavorite, toggleFavorite } = useFavoritesContext();
  const [tracks,  setTracks]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    favoritesAPI.getFavorites(200)
      .then(t => { setTracks(t || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00';
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Heart size={22} className="text-[#CC2020]" fill="currentColor" />
        <h1 className="text-2xl font-semibold text-[#EBEBED]">Favorites</h1>
        {!loading && <span className="text-sm text-[#3D3D45]">· {tracks.length} tracks</span>}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[#C49A28]" />
        </div>
      )}

      {!loading && tracks.length === 0 && (
        <div className="text-center py-20">
          <Heart size={40} className="mx-auto text-[#3D3D45] mb-3" />
          <p className="text-[#888890]">No favorites yet</p>
          <p className="text-[#3D3D45] text-sm mt-1">Heart any track to save it here</p>
        </div>
      )}

      {!loading && tracks.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {tracks.map(track => (
            <TrackCard
              key={track.id || track._id}
              track={track}
              onPlay={(t) => playTrack(t, tracks)}
              onFavorite={toggleFavorite}
              onAddToQueue={addToQueue}
              isFavorite={isFavorite}
              formatTime={formatTime}
            />
          ))}
        </div>
      )}
    </div>
  );
});

FavoritesView.displayName = 'FavoritesView';
export default FavoritesView;
