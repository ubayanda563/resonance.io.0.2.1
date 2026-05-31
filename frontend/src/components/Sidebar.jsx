import React, { memo } from 'react';
import { Home, Search, BookOpen, Heart, ListMusic, Youtube, Compass } from 'lucide-react';
import { usePlayer } from '../contexts/PlayerContext';

const NAV = [
  { id: 'home',      label: 'Home',      icon: Home       },
  { id: 'search',    label: 'Search',    icon: Search     },
  { id: 'library',   label: 'Library',   icon: BookOpen   },
  { id: 'favorites', label: 'Favorites', icon: Heart      },
  { id: 'playlists', label: 'Playlists', icon: ListMusic  },
  { id: 'youtube',   label: 'YouTube',   icon: Youtube    },
  { id: 'discover',  label: 'Discover',  icon: Compass    },
];

const Sidebar = memo(({ view, onNavigate }) => {
  const { currentTrack, isPlaying } = usePlayer();

  return (
    <aside className="glass-surface-dark border-r border-[rgba(200,200,204,0.08)] w-[68px] md:w-[200px] flex flex-col py-5 flex-shrink-0">
      {/* Brand */}
      <div className="px-4 pb-5 border-b border-[rgba(200,200,204,0.07)] mb-4">
        <div className="font-display text-lg tracking-[0.1em] text-[#EBEBED] hidden md:block">RESONANCE</div>
        <div className="text-[8px] tracking-[0.5em] text-[#3D3D45] uppercase hidden md:block mt-0.5">Player</div>
        <div className="md:hidden flex items-center justify-center">
          <div className="w-7 h-7 rounded-lg glass-dark flex items-center justify-center">
            <span className="text-[#C49A28] font-bold text-xs">R</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 px-2 flex-1">
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = view === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 w-full text-left transition-all ${
                active
                  ? 'glass-surface text-[#EBEBED] border border-[rgba(200,200,204,0.12)]'
                  : 'text-[#55555E] hover:text-[#EBEBED] hover:bg-[rgba(200,200,204,0.04)]'
              }`}
            >
              <Icon size={16} className="flex-shrink-0" />
              <span className="text-sm hidden md:block">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Mini now-playing indicator */}
      {currentTrack && (
        <div className="px-3 pt-4 border-t border-[rgba(200,200,204,0.07)]">
          <div className="hidden md:flex items-center gap-2.5 overflow-hidden">
            <img src={currentTrack.artwork_url} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-[#EBEBED] truncate">{currentTrack.title}</p>
              <div className="flex items-center gap-1 mt-0.5">
                {isPlaying
                  ? <div className="flex items-end gap-0.5 h-3">{[2,4,3,5,2].map((h,i)=><div key={i} className="w-0.5 bg-[#C49A28] rounded-full animate-pulse" style={{height:h*2,animationDelay:`${i*100}ms`}}/>)}</div>
                  : <span className="text-[10px] text-[#3D3D45]">Paused</span>
                }
              </div>
            </div>
          </div>
          <div className="md:hidden flex justify-center">
            <div className="w-2 h-2 bg-[#C49A28] rounded-full animate-pulse" />
          </div>
        </div>
      )}
    </aside>
  );
});

Sidebar.displayName = 'Sidebar';
export default Sidebar;
