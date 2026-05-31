import React, { memo, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Heart, ListMusic } from 'lucide-react';
import { Slider } from '../ui/slider';
import { usePlayer } from '../../contexts/PlayerContext';
import { useFavoritesContext } from '../../contexts/FavoritesContext';
import FullPlayerView from './FullPlayerView';

const BottomPlayerBar = memo(() => {
  const {
    currentTrack, isPlaying, currentTime, duration,
    volume, togglePlayPause, playNext, playPrevious,
    seek, setVolume, formatTime,
  } = usePlayer();
  const { isFavorite, toggleFavorite } = useFavoritesContext();
  const [showFull, setShowFull] = useState(false);

  if (!currentTrack) return null;

  const id      = currentTrack.id || currentTrack._id;
  const favored = isFavorite(id);
  const pct     = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {showFull && <FullPlayerView onClose={() => setShowFull(false)} />}

      <div className="glass-surface-dark border-t border-[rgba(200,200,204,0.08)] px-4 md:px-6 py-3 flex items-center gap-3 md:gap-5">
        {/* Artwork — tap to open full player */}
        <div
          onClick={() => setShowFull(true)}
          className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer hover:ring-2 ring-[rgba(196,154,40,0.4)] transition-all"
        >
          <img src={currentTrack.artwork_url} alt={currentTrack.title} className="w-full h-full object-cover" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setShowFull(true)}>
          <p className="text-sm font-semibold text-[#EBEBED] truncate">{currentTrack.title}</p>
          <p className="text-xs text-[#888890] truncate">{currentTrack.artist}</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={playPrevious} className="text-[#888890] hover:text-[#EBEBED] p-1.5 transition-colors">
            <SkipBack size={17} />
          </button>
          <button
            onClick={togglePlayPause}
            className="btn-play rounded-full p-2.5 w-9 h-9 flex items-center justify-center text-[#030306]"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button onClick={playNext} className="text-[#888890] hover:text-[#EBEBED] p-1.5 transition-colors">
            <SkipForward size={17} />
          </button>
        </div>

        {/* Progress — hidden on small screens */}
        <div className="hidden md:flex items-center gap-2 flex-1 max-w-xs">
          <span className="text-[10px] text-[#3D3D45] tabular-nums">{formatTime(currentTime)}</span>
          <Slider value={[pct]} onValueChange={([v]) => seek((v / 100) * duration)} max={100} step={0.1} className="flex-1" />
          <span className="text-[10px] text-[#3D3D45] tabular-nums">{formatTime(duration)}</span>
        </div>

        {/* Favorite + volume — desktop only */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          <button onClick={() => toggleFavorite(id)} className="p-1.5 text-[#55555E] hover:text-[#CC2020] transition-colors">
            <Heart size={16} fill={favored ? 'currentColor' : 'none'} className={favored ? 'text-[#CC2020]' : ''} />
          </button>
          <button onClick={() => setShowFull(true)} className="p-1.5 text-[#55555E] hover:text-[#EBEBED] transition-colors" title="Open full player">
            <ListMusic size={16} />
          </button>
          <Slider value={[volume]} onValueChange={([v]) => setVolume(v)} max={100} step={1} className="w-20" />
        </div>
      </div>
    </>
  );
});

BottomPlayerBar.displayName = 'BottomPlayerBar';
export default BottomPlayerBar;
