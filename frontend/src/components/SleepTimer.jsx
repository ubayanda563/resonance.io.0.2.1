import React, { useState, memo } from 'react';
import { Moon, X } from 'lucide-react';
import { Button } from './ui/button';
import { usePlayer } from '../contexts/PlayerContext';

const PRESETS = [15, 30, 45, 60, 90];

const formatRemaining = (seconds) => {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

/**
 * SleepTimer — set a countdown to auto-pause playback (#7).
 */
const SleepTimer = memo(() => {
  const { sleepTimer, startSleepTimer, cancelSleepTimer } = usePlayer();
  const [open, setOpen] = useState(false);

  if (!open && !sleepTimer) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="glass-button rounded-full p-2 text-[#888890] hover:text-[#EBEBED]"
        title="Sleep timer"
      >
        <Moon size={16} />
      </button>
    );
  }

  if (sleepTimer) {
    const pct = (sleepTimer.remaining / sleepTimer.total) * 100;
    return (
      <div className="flex items-center gap-2 glass-dark rounded-full px-3 py-1.5">
        <Moon size={13} className="text-[#C49A28]" />
        <span className="text-xs text-[#C49A28] tabular-nums w-14">
          {formatRemaining(sleepTimer.remaining)}
        </span>
        <button onClick={cancelSleepTimer} className="text-[#3D3D45] hover:text-[#CC2020]">
          <X size={12} />
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-4 flex flex-col gap-3 min-w-[180px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Moon size={14} className="text-[#C49A28]" />
          <span className="text-xs text-[#EBEBED] font-medium">Sleep Timer</span>
        </div>
        <button onClick={() => setOpen(false)} className="text-[#3D3D45] hover:text-[#EBEBED]">
          <X size={14} />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {PRESETS.map(m => (
          <Button
            key={m}
            size="sm"
            className="glass-button rounded-xl text-xs px-2 py-1.5 h-auto"
            onClick={() => { startSleepTimer(m); setOpen(false); }}
          >
            {m}m
          </Button>
        ))}
      </div>
    </div>
  );
});

SleepTimer.displayName = 'SleepTimer';
export default SleepTimer;
