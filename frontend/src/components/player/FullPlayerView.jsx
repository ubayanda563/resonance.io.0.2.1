import React, { useState, memo } from 'react';
import { X, Shuffle, Repeat, SkipBack, SkipForward, Play, Pause, Volume2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { usePlayer } from '../../contexts/PlayerContext';
import LyricsPanel from '../LyricsPanel';
import Equalizer from '../Equalizer';
import QueuePanel from '../QueuePanel';
import SleepTimer from '../SleepTimer';

const TABS = ['Player', 'Lyrics', 'Queue', 'EQ'];

const FullPlayerView = memo(({ onClose }) => {
  const {
    currentTrack, isPlaying, currentTime, duration,
    volume, shuffle, repeat,
    togglePlayPause, playNext, playPrevious,
    seek, setVolume, setShuffle, setRepeat,
    crossfadeDuration, setCrossfadeDuration,
    formatTime,
  } = usePlayer();

  const [tab, setTab] = useState('Player');

  const toggleRepeat = () =>
    setRepeat(r => r === 'none' ? 'playlist' : r === 'playlist' ? 'track' : 'none');

  if (!currentTrack) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#030306] text-[#EBEBED] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(200,200,204,0.08)] glass-surface-dark">
        <button onClick={onClose} className="rounded-full p-2.5 glass-button-dark">
          <X size={20} />
        </button>

        {/* Tabs */}
        <div className="flex items-center gap-1 glass-dark rounded-full p-1">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                tab === t ? 'bg-[rgba(200,200,204,0.12)] text-[#EBEBED]' : 'text-[#55555E] hover:text-[#EBEBED]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <SleepTimer />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {tab === 'Player' && (
          <div className="mx-auto max-w-lg flex flex-col items-center gap-6">
            {/* Artwork */}
            <div className="w-[min(72vw,320px)] aspect-square rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-[rgba(200,200,204,0.15)]">
              <img src={currentTrack.artwork_url} alt={currentTrack.title} className="w-full h-full object-cover" />
            </div>

            {/* Track info */}
            <div className="text-center w-full">
              <p className="text-xs uppercase tracking-[0.5em] text-[#3D3D45] mb-2">Now Playing</p>
              <h2 className="text-3xl font-semibold text-[#EBEBED] mb-1">{currentTrack.title}</h2>
              <p className="text-[#888890]">{currentTrack.artist}</p>
            </div>

            {/* Progress */}
            <div className="w-full glass-dark rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-[#3D3D45] text-xs tabular-nums">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <Slider
                value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
                onValueChange={([v]) => seek((v / 100) * duration)}
                max={100} step={0.1}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-5 w-full">
              <button
                onClick={() => setShuffle(!shuffle)}
                className={`rounded-full p-3 transition ${shuffle ? 'text-[#C49A28] glass-dark' : 'glass-button-dark text-[#888890]'}`}
              >
                <Shuffle size={20} />
              </button>
              <button onClick={playPrevious} className="rounded-full p-3 glass-button-dark">
                <SkipBack size={24} />
              </button>
              <button
                onClick={togglePlayPause}
                className="btn-play rounded-full p-5 text-[#030306] shadow-xl"
              >
                {isPlaying ? <Pause size={28} /> : <Play size={28} />}
              </button>
              <button onClick={playNext} className="rounded-full p-3 glass-button-dark">
                <SkipForward size={24} />
              </button>
              <button
                onClick={toggleRepeat}
                className={`rounded-full p-3 transition relative ${repeat !== 'none' ? 'text-[#C49A28] glass-dark' : 'glass-button-dark text-[#888890]'}`}
              >
                <Repeat size={20} />
                {repeat === 'track' && (
                  <span className="absolute top-0 right-0 w-3 h-3 bg-[#C49A28] rounded-full text-[7px] text-[#030306] flex items-center justify-center font-bold">1</span>
                )}
              </button>
            </div>

            {/* Volume */}
            <div className="w-full glass-dark rounded-2xl p-4 flex items-center gap-3">
              <Volume2 size={16} className="text-[#888890] flex-shrink-0" />
              <Slider value={[volume]} onValueChange={([v]) => setVolume(v)} max={100} step={1} className="flex-1" />
              <span className="text-[#888890] text-xs tabular-nums w-8 text-right">{volume}</span>
            </div>

            {/* Crossfade setting */}
            <div className="w-full glass-dark rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#888890] uppercase tracking-[0.4em]">Crossfade</span>
                <span className="text-xs text-[#C49A28] tabular-nums">{crossfadeDuration}s</span>
              </div>
              <Slider
                value={[crossfadeDuration]}
                onValueChange={([v]) => setCrossfadeDuration(v)}
                min={0} max={8} step={0.5}
              />
            </div>
          </div>
        )}

        {tab === 'Lyrics' && (
          <div className="mx-auto max-w-lg h-full">
            <LyricsPanel track={currentTrack} />
          </div>
        )}

        {tab === 'Queue' && (
          <div className="mx-auto max-w-lg">
            <QueuePanel />
          </div>
        )}

        {tab === 'EQ' && (
          <div className="mx-auto max-w-lg glass-card-dark rounded-3xl p-6">
            <Equalizer />
          </div>
        )}
      </div>
    </div>
  );
});

FullPlayerView.displayName = 'FullPlayerView';
export default FullPlayerView;
