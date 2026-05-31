import React, { memo } from 'react';
import { Play, Heart, Plus, ListPlus } from 'lucide-react';
import { Button } from './ui/button';
import StarRating from './StarRating';

/**
 * TrackCard — extracted, memoized, and now includes:
 *  - Add to queue button (#12)
 *  - Star rating (#13)
 */
const TrackCard = memo(({
  track,
  onPlay,
  onFavorite,
  onAddToQueue,
  onAddToPlaylist,
  index,
  showArtist = true,
  isFavorite,
  formatTime,
}) => {
  const id = track._id || track.id;
  const favored = isFavorite(id);

  return (
    <div
      onClick={() => onPlay(track)}
      className="group cursor-pointer overflow-hidden glass-card-dark shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all"
    >
      <div className="aspect-square overflow-hidden relative">
        <img
          src={track.artwork_url}
          alt={track.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5">
          <Button
            size="sm"
            className="btn-play rounded-full p-2"
            onClick={(e) => { e.stopPropagation(); onPlay(track); }}
          >
            <Play size={15} />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full p-2"
            onClick={(e) => { e.stopPropagation(); onFavorite(id); }}
          >
            <Heart size={15} fill={favored ? 'currentColor' : 'none'} />
          </Button>
          {onAddToQueue && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-full p-2"
              title="Add to queue"
              onClick={(e) => { e.stopPropagation(); onAddToQueue(track); }}
            >
              <ListPlus size={15} />
            </Button>
          )}
          {onAddToPlaylist && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-full p-2"
              title="Add to playlist"
              onClick={(e) => { e.stopPropagation(); onAddToPlaylist(track); }}
            >
              <Plus size={15} />
            </Button>
          )}
        </div>
      </div>

      <div className="p-3 space-y-1 backdrop-blur-xl">
        {index != null && <p className="text-xs text-[#3D3D45]">{index}</p>}
        <h3 className="text-[#EBEBED] font-semibold truncate text-sm">{track.title}</h3>
        {showArtist && <p className="text-[#888890] text-xs truncate">{track.artist}</p>}
        <div className="flex items-center justify-between pt-0.5">
          <p className="text-[#3D3D45] text-xs">{formatTime(track.duration || 0)}</p>
          <StarRating
            trackId={id}
            initialRating={track.user_rating || 0}
            size={11}
          />
        </div>
      </div>
    </div>
  );
});

TrackCard.displayName = 'TrackCard';
export default TrackCard;
