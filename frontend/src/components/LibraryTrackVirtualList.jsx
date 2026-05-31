import React, { useState, useRef, useEffect, memo } from 'react';
import { Play, Pause, Heart } from 'lucide-react';
import { Button } from './ui/button';
import StarRating from './StarRating';
import { SmoothMusicScroller } from '../utils/SmoothMusicScroller';
import { usePlayer } from '../contexts/PlayerContext';
import { useFavoritesContext } from '../contexts/FavoritesContext';

/**
 * LibraryTrackVirtualList — uses extracted SmoothMusicScroller (#2)
 * and now shows add-to-queue + star rating (#12, #13).
 */
const LibraryTrackVirtualList = memo(({ tracks, onPlay, onFavorite, onAddToPlaylist }) => {
  const { isPlaying, currentTrack, addToQueue, formatTime } = usePlayer();
  const { isFavorite } = useFavoritesContext();
  const [range, setRange]   = useState({ start: 0, end: Math.min(14, tracks.length) });
  const listRef             = useRef(null);
  const ITEM_HEIGHT         = 112;

  useEffect(() => {
    if (!listRef.current) return;
    const scroller = new SmoothMusicScroller(listRef.current, (s, e) => setRange({ start: s, end: e }));
    scroller.setItems(tracks.length);
    setRange({ start: 0, end: Math.min(14, tracks.length) });
    return () => scroller.destroy();
  }, [tracks.length]);

  return (
    <div
      ref={listRef}
      className="relative overflow-y-auto h-[64vh] rounded-3xl border border-[rgba(200,200,204,0.08)] bg-black/30 backdrop-blur-xl"
    >
      <div style={{ height: tracks.length * ITEM_HEIGHT }} />
      <div className="absolute inset-x-0" style={{ transform: `translateY(${range.start * ITEM_HEIGHT}px)` }}>
        {tracks.slice(range.start, range.end).map((track, idx) => {
          const id       = track.id || track._id;
          const isActive = currentTrack?.id === id || currentTrack?._id === id;
          const favored  = isFavorite(id);

          return (
            <div
              key={id || range.start + idx}
              onClick={() => onPlay(track)}
              className="group flex items-center gap-4 p-4 glass-card-dark hover:-translate-y-0.5 hover:shadow-xl cursor-pointer transition-all"
              style={{ height: ITEM_HEIGHT }}
            >
              <div className="relative h-16 w-16 overflow-hidden rounded-2xl ring-1 ring-[rgba(200,200,204,0.1)] flex-shrink-0">
                <img src={track.artwork_url} alt={track.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  {isActive && isPlaying ? <Pause size={18} className="text-white" /> : <Play size={18} className="text-white" />}
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <h3 className={`text-base font-semibold truncate ${isActive ? 'text-[#C49A28]' : 'text-[#EBEBED]'}`}>{track.title}</h3>
                <p className="text-[#888890] truncate text-sm">{track.artist}</p>
                <p className="text-[#3D3D45] text-xs mt-0.5">{track.album || 'Single'}</p>
              </div>

              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-[#888890] text-sm">{formatTime(track.duration || 0)}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); addToQueue(track); }}
                    className="opacity-0 group-hover:opacity-100 transition text-[#55555E] hover:text-[#C49A28]"
                    title="Add to queue"
                  >
                    +Q
                  </button>
                  <Button
                    variant="ghost" size="sm"
                    onClick={(e) => { e.stopPropagation(); onFavorite(id); }}
                    className="rounded-full p-1.5"
                  >
                    <Heart size={16} fill={favored ? 'currentColor' : 'none'} className={favored ? 'text-[#CC2020]' : ''} />
                  </Button>
                </div>
                <StarRating trackId={id} initialRating={track.user_rating || 0} size={11} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

LibraryTrackVirtualList.displayName = 'LibraryTrackVirtualList';
export default LibraryTrackVirtualList;
