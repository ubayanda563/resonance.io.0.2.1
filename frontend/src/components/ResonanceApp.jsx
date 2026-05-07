import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Search,
  Menu,
  Heart,
  MoreVertical,
  ArrowLeft,
  Shuffle,
  Repeat,
  Upload,
  Plus,
  Home,
  Library,
  Music,
  Youtube,
  X,
  ChevronRight,
  User,
  ChevronLeft,
  Clock,
  Settings,
  ListMusic,
  Trash2,
  Flame,
  Sparkles,
  Disc3,
  Mic2,
  HelpCircle,
} from 'lucide-react';
import { trackAPI, handleApiError, recommendationsAPI } from '../services/api';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useSearch } from '../hooks/useSearch';
import { useFavoritesContext } from '../contexts/FavoritesContext';
import { usePlaylistContext } from '../contexts/PlaylistContext';
import FileUploadDialog from './FileUploadDialog';
import YouTubeSearch from './YouTubeSearch';
import Toaster from './Toaster';
import { useToast } from '../hooks/use-toast';
import { mockLibraryData } from '../data/mockData';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Slider } from './ui/slider';
import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Switch } from './ui/switch';

const HOME_MODULE_DEFAULTS = [
  { id: 'nowPlaying', label: 'Now Playing', enabled: true },
  { id: 'recentlyPlayed', label: 'Recently Played', enabled: true },
  { id: 'genres', label: 'Browse Genres', enabled: true },
  { id: 'queuePreview', label: 'Queue Preview', enabled: true },
];

const VIEW_ORDER = ['home', 'search', 'library'];

const ResonanceApp = () => {
  const [currentView, setCurrentView] = useState('home');
  const [transitionDirection, setTransitionDirection] = useState('fade');
  const [swipeStartX, setSwipeStartX] = useState(null);
  const [isFullPlayer, setIsFullPlayer] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [githubAvatar, setGithubAvatar] = useState('');
  const [recentTracks, setRecentTracks] = useState([]);
  const [trendingTracks, setTrendingTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showYouTubeSearch, setShowYouTubeSearch] = useState(false);
  const [showHomeSettings, setShowHomeSettings] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [homeModules, setHomeModules] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('resonanceHomeModules');
        return stored ? JSON.parse(stored) : HOME_MODULE_DEFAULTS;
      } catch {
        return HOME_MODULE_DEFAULTS;
      }
    }
    return HOME_MODULE_DEFAULTS;
  });
  const { toast } = useToast();
  const { isFavorite, toggleFavorite } = useFavoritesContext();
  const { playlists, createPlaylist } = usePlaylistContext();
  const {
    searchResults,
    searchHistory,
    isSearching: isSearching_hook,
    searchTracks,
    clearResults,
    clearSearchHistory,
    deleteHistoryItem,
  } = useSearch();

  // Audio player hook
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlayPause,
    playTrack,
    formatTime,
    seek,
    playNext,
    playPrevious,
    volume,
    setVolume,
    shuffle,
    setShuffle,
    repeat,
    setRepeat,
    queue,
    addToQueue,
    removeFromQueue,
    clearQueue,
  } = useAudioPlayer();

  // Fetch GitHub avatar
  useEffect(() => {
    fetch('https://api.github.com/users/Moodstlbn')
      .then(res => res.json())
      .then(data => setGithubAvatar(data.avatar_url))
      .catch(() => setGithubAvatar('https://github.com/Moodstlbn.png'));
  }, []);

  // Load recent tracks
  useEffect(() => {
    loadRecentTracks();
    loadTrendingTracks();
  }, []);

  const loadRecentTracks = async () => {
    setIsLoading(true);
    try {
      const tracks = await trackAPI.getRecentTracks(20);
      setRecentTracks(tracks);
    } catch (error) {
      const errorInfo = handleApiError(error);
      toast({
        title: "Failed to load tracks",
        description: errorInfo.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadTrendingTracks = async () => {
    try {
      const tracks = await recommendationsAPI.getTrending(10);
      setTrendingTracks(tracks);
    } catch (error) {
      console.error('Failed to load trending tracks:', error);
    }
  };

  const handleTrackSelect = (track) => {
    playTrack(track, recentTracks);
  };

  const handleToggleFavorite = async (e, trackId) => {
    e.stopPropagation();
    try {
      await toggleFavorite(trackId);
      const action = isFavorite(trackId) ? 'removed from' : 'added to';
      toast({
        title: 'Success',
        description: `Track ${action} favorites`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update favorite status',
        variant: 'destructive',
      });
    }
  };

  const TrackCard = ({ track, onPlay, onFavorite, index, showArtist = true }) => (
    <div
      onClick={() => onPlay(track)}
      className="group cursor-pointer overflow-hidden glass-card-dark shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all"
    >
      <div className="aspect-square overflow-hidden relative">
        <img src={track.artwork_url} alt={track.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
          <Button size="sm" className="bg-white text-slate-950 hover:bg-slate-100 rounded-full p-2">
            <Play size={16} />
          </Button>
          <Button size="sm" variant="outline" className="rounded-full p-2" onClick={onFavorite}>
            <Heart size={16} fill={isFavorite(track._id || track.id) ? 'currentColor' : 'none'} />
          </Button>
        </div>
      </div>
      <div className="p-4 space-y-1 backdrop-blur-xl">
        <p className="text-xs text-slate-400">{index || ''}</p>
        <h3 className="text-white font-semibold truncate">{track.title}</h3>
        {showArtist && <p className="text-slate-400 text-sm truncate">{track.artist}</p>}
        <p className="text-slate-500 text-xs">{formatTime(track.duration || 0)}</p>
      </div>
    </div>
  );

  const handleUploadComplete = (uploadedTracks) => {
    setRecentTracks(prev => [...uploadedTracks, ...prev].slice(0, 20));
    setShowUploadDialog(false);
  };

  const handleLocalFilePlay = (track) => {
    setRecentTracks(prev => [track, ...prev].slice(0, 20));
    playTrack(track);
    setShowUploadDialog(false);
  };

  const saveHomeModules = (nextModules) => {
    setHomeModules(nextModules);
    if (typeof window !== 'undefined') {
      localStorage.setItem('resonanceHomeModules', JSON.stringify(nextModules));
    }
  };

  const toggleHomeModule = (moduleId) => {
    saveHomeModules(homeModules.map((module) => module.id === moduleId ? { ...module, enabled: !module.enabled } : module));
  };

  const moveHomeModule = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= homeModules.length) return;
    const reordered = [...homeModules];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(nextIndex, 0, moved);
    saveHomeModules(reordered);
  };

  const openHomeSettings = () => setShowHomeSettings(true);

  const changeView = (view) => {
    if (view === currentView) return;
    const currentIndex = VIEW_ORDER.indexOf(currentView);
    const nextIndex = VIEW_ORDER.indexOf(view);
    setTransitionDirection(nextIndex > currentIndex ? 'left' : 'right');
    setCurrentView(view);
  };

  const handleSwipeStart = (event) => {
    setSwipeStartX(event.touches?.[0]?.clientX ?? null);
  };

  const handleSwipeEnd = (event) => {
    if (swipeStartX === null) return;
    const endX = event.changedTouches?.[0]?.clientX ?? null;
    if (endX === null) {
      setSwipeStartX(null);
      return;
    }
    const diff = endX - swipeStartX;
    if (Math.abs(diff) > 60) {
      const currentIndex = VIEW_ORDER.indexOf(currentView);
      if (diff < 0 && currentIndex < VIEW_ORDER.length - 1) {
        changeView(VIEW_ORDER[currentIndex + 1]);
      } else if (diff > 0 && currentIndex > 0) {
        changeView(VIEW_ORDER[currentIndex - 1]);
      }
    }
    setSwipeStartX(null);
  };

  const handleYouTubeTrackSelect = (track) => {
    setRecentTracks(prev => [track, ...prev].slice(0, 20));
    playTrack(track);
    setShowYouTubeSearch(false);
  };

  const toggleRepeat = () => {
    setRepeat(prev => {
      if (prev === 'none') return 'playlist';
      if (prev === 'playlist') return 'track';
      return 'none';
    });
  };

  const navigationItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'library', label: 'Your Library', icon: Library },
  ];

  const Sidebar = () => (
    <div className={`${sidebarCollapsed ? 'w-20' : 'w-72'} relative glass-surface-dark border-r border-white/15 text-slate-100 flex flex-col transition-all duration-300`}> 
      <div className="p-6 border-b border-white/10 glass-surface-dark">
        <div className="flex items-center gap-3">
          {githubAvatar && (
            <div className="w-10 h-10 rounded-2xl overflow-hidden ring-1 ring-white/20 shadow-lg shadow-white/10">
              <img src={githubAvatar} alt="Resonance" className="w-full h-full object-cover" />
            </div>
          )}
          {!sidebarCollapsed && (
            <div>
              <h1 className="text-xl font-semibold tracking-wide text-white">Resonance</h1>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400 mt-1">Music player</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 ${
                currentView === item.id
                  ? 'glass-surface text-white shadow-lg shadow-white/10'
                  : 'text-slate-400 hover:text-white hover:glass-surface-dark'
              }`}
            >
              <Icon size={22} />
              {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          );
        })}

        <div className="mt-8 space-y-2">
          <div className="px-4 pb-2">
            {!sidebarCollapsed && <h3 className="text-xs uppercase tracking-[0.3em] text-slate-400">Library</h3>}
          </div>
          <button
            onClick={() => setShowUploadDialog(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-200 hover:text-white glass-button-dark"
          >
            <Plus size={22} />
            {!sidebarCollapsed && <span className="text-sm font-medium">Add Music</span>}
          </button>
          <button
            onClick={() => setShowYouTubeSearch(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-200 hover:text-white glass-button-dark"
          >
            <Youtube size={22} />
            {!sidebarCollapsed && <span className="text-sm font-medium">YouTube</span>}
          </button>
        </div>
      </nav>

      <div className="p-4 border-t border-white/10 glass-surface-dark">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-white/20 to-white/10 rounded-2xl flex items-center justify-center ring-1 ring-white/20 backdrop-blur-md">
            <User size={16} className="text-slate-300" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">Guest User</p>
              <p className="text-slate-500 text-xs truncate">Free account</p>
            </div>
          )}
          {!sidebarCollapsed && (
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
              <Settings size={16} />
            </Button>
          )}
        </div>
      </div>

      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="absolute top-1/2 -right-4 z-10 w-9 h-9 glass-button-dark hover:glass-hover-dark rounded-full flex items-center justify-center text-slate-300 hover:text-white"
      >
        {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </div>
  );

  const HomeView = () => (
    <ScrollArea className="flex-1">
      <div className="p-6 md:p-8 space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.4em] text-slate-400">Good evening</p>
            <h1 className="text-4xl md:text-5xl font-semibold text-white tracking-tight">Your music, your mood.</h1>
            <p className="max-w-2xl text-slate-400">Stream your library, continue listening, and manage playlists with a premium player feel across every view.</p>
          </div>
          <Button variant="outline" onClick={openHomeSettings} className="text-slate-300 hover:text-white rounded-full px-5 py-3">
            Customize home
          </Button>
        </div>

        {homeModules.find((module) => module.id === 'nowPlaying')?.enabled && currentTrack && (
          <div className="glass-card-dark overflow-hidden shadow-2xl">
            <div className="grid gap-6 md:grid-cols-[280px_1fr] items-center p-6">
              <div className="rounded-[2rem] overflow-hidden shadow-xl shadow-white/10 ring-1 ring-white/20">
                <img src={currentTrack.artwork_url} alt={currentTrack.title} className="w-full h-full object-cover" />
              </div>

              <div className="space-y-5">
                <div>
                  <h2 className="text-lg uppercase tracking-[0.3em] text-slate-400">Now Playing</h2>
                  <h3 className="text-3xl font-semibold text-white mt-3">{currentTrack.title}</h3>
                  <p className="text-slate-400 mt-2">{currentTrack.artist}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button variant="secondary" className="rounded-full px-5 py-3 glass-button">Play</Button>
                  <Button variant="outline" className="rounded-full px-5 py-3 glass-button-dark">Queue</Button>
                  <Button variant="ghost" className="rounded-full px-5 py-3 text-white/80">Share</Button>
                </div>

                <div className="glass-dark rounded-2xl p-4">
                  <div className="flex items-center justify-between text-slate-400 text-sm mb-3">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                  <Slider
                    value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
                    onValueChange={(value) => seek((value[0] / 100) * duration)}
                    max={100}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {homeModules.find((module) => module.id === 'recentlyPlayed')?.enabled && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">Recently Played</h2>
                <p className="text-slate-500">Tap to continue listening to your latest tracks.</p>
              </div>
              <Button variant="ghost" className="text-slate-300 hover:text-white">Show all</Button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div key={idx} className="h-56 rounded-3xl glass-dark-sm animate-pulse" />
                ))}
              </div>
            ) : recentTracks.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {recentTracks.slice(0, 10).map((track, idx) => (
                  <TrackCard
                    key={idx}
                    track={track}
                    onPlay={handleTrackSelect}
                    onFavorite={(e) => handleToggleFavorite(e, track._id || track.id)}
                    index={idx + 1}
                  />
                ))}
              </div>
            ) : (
              <div className="glass-card-dark p-12 text-center border-dashed border-2">
                <Music size={48} className="mx-auto mb-4 text-slate-500" />
                <h3 className="text-white text-xl font-semibold mb-2">No music yet</h3>
                <p className="text-slate-400 mb-6">Upload a track or search YouTube to start streaming.</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Button onClick={() => setShowUploadDialog(true)} className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 rounded-full px-5 py-3">Upload Music</Button>
                  <Button onClick={() => setShowYouTubeSearch(true)} className="glass-button-dark rounded-full px-5 py-3 text-white">YouTube Search</Button>
                </div>
              </div>
            )}
            {queue.length > 0 && (
              <div className="glass-card-dark p-6 mt-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 text-slate-400 text-sm uppercase tracking-[0.3em]">
                      <ListMusic size={16} />
                      <span>Play Queue</span>
                    </div>
                    <h3 className="text-xl font-semibold text-white">Up next</h3>
                  </div>
                  <Button variant="ghost" size="sm" onClick={clearQueue} className="text-slate-300 hover:text-white">
                    Clear queue
                  </Button>
                </div>
                <div className="space-y-3">
                  {queue.map((track, idx) => (
                    <div key={track.id || idx} className="flex items-center justify-between gap-4 glass-dark rounded-2xl p-4">
                      <div>
                        <p className="text-sm text-slate-400">{idx + 1}. {track.title}</p>
                        <p className="text-sm text-white truncate">{track.artist}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" className="glass-button-dark rounded-full px-3 py-2" onClick={() => playTrack(track, queue)}>
                          Play
                        </Button>
                        <Button size="sm" className="glass-button-dark rounded-full p-2" onClick={() => removeFromQueue(idx)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {homeModules.find((module) => module.id === 'genres')?.enabled && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">Browse Genres</h2>
                <p className="text-slate-400">Find playlists, moods, and trends curated for you.</p>
              </div>
              <Button variant="ghost" className="text-slate-300 hover:text-white">More</Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {[
                { title: "Pop", color: "from-pink-500 to-rose-500" },
                { title: "Hip-Hop", color: "from-orange-500 to-red-500" },
                { title: "Rock", color: "from-purple-500 to-indigo-500" },
                { title: "Jazz", color: "from-blue-500 to-cyan-500" },
                { title: "Classical", color: "from-green-500 to-emerald-500" },
                { title: "Electronic", color: "from-yellow-500 to-orange-500" }
              ].map((genre, idx) => (
                <div key={idx} className={`overflow-hidden rounded-3xl bg-gradient-to-br ${genre.color} shadow-xl shadow-black/30 transition hover:shadow-2xl hover:-translate-y-1 p-5 h-28 flex items-end cursor-pointer group glass-card`}> 
                  <h3 className="text-white font-semibold text-lg group-hover:scale-105 transition-transform">{genre.title}</h3>
                </div>
              ))}
            </div>
          </div>
        )}

        {homeModules.find((module) => module.id === 'queuePreview')?.enabled && queue.length > 0 && (
          <div className="glass-card-dark p-6 mt-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 text-slate-400 text-sm uppercase tracking-[0.3em]">
                  <ListMusic size={16} />
                  <span>Play Queue</span>
                </div>
                <h3 className="text-xl font-semibold text-white">Up next</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={clearQueue} className="text-slate-300 hover:text-white">
                Clear queue
              </Button>
            </div>
            <div className="space-y-3">
              {queue.map((track, idx) => (
                <div key={track.id || idx} className="flex items-center justify-between gap-4 glass-dark rounded-2xl p-4">
                  <div>
                    <p className="text-sm text-slate-400">{idx + 1}. {track.title}</p>
                    <p className="text-sm text-white truncate">{track.artist}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" className="glass-button-dark rounded-full px-3 py-2" onClick={() => playTrack(track, queue)}>
                      Play
                    </Button>
                    <Button size="sm" className="glass-button-dark rounded-full p-2" onClick={() => removeFromQueue(idx)}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );

  const SearchView = () => {
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (query) => {
      setSearchQuery(query);
      if (query.trim()) {
        searchTracks(query, 30);
      } else {
        clearResults();
      }
    };

    return (
      <ScrollArea className="flex-1">
        <div className="p-6 md:p-8 space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold text-white">Search your library</h1>
            <div className="max-w-2xl">
              <div className="relative">
                <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by title, artist, or album..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="glass-input w-full py-4 pl-14 pr-4 rounded-2xl font-medium text-white placeholder-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Search History */}
          {!searchQuery && searchHistory.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Recent searches</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearchHistory}
                  className="text-slate-400 hover:text-white"
                >
                  Clear all
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((item, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    className="border-white/20 text-slate-300 hover:text-white rounded-full"
                    onClick={() => handleSearch(item.query)}
                  >
                    {item.query}
                    <X
                      size={14}
                      className="ml-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteHistoryItem(item.query);
                      }}
                    />
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchQuery && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-white">
                  Results for "{searchQuery}" ({searchResults.length})
                </h2>
              </div>

              {isSearching_hook ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div key={idx} className="h-56 rounded-3xl glass-dark-sm animate-pulse" />
                  ))}
                </div>
              ) : searchResults.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {searchResults.map((track, idx) => (
                    <TrackCard
                      key={idx}
                      track={track}
                      onPlay={handleTrackSelect}
                      onFavorite={(e) => handleToggleFavorite(e, track._id || track.id)}
                      index={idx + 1}
                    />
                  ))}
                </div>
              ) : (
                <div className="glass-card-dark p-12 text-center border-dashed border-2">
                  <Search size={48} className="mx-auto mb-4 text-slate-500" />
                  <h3 className="text-white text-xl font-semibold mb-2">No results found</h3>
                  <p className="text-slate-400">Try searching for a different song, artist, or album.</p>
                </div>
              )}
            </div>
          )}

          {/* Browse Sections */}
          {!searchQuery && (
            <div className="space-y-8">
              {/* Trending */}
              {trendingTracks.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="text-orange-500" />
                      <h2 className="text-2xl font-semibold text-white">Trending Now</h2>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {trendingTracks.slice(0, 10).map((track, idx) => (
                      <TrackCard
                        key={idx}
                        track={track}
                        onPlay={handleTrackSelect}
                        onFavorite={(e) => handleToggleFavorite(e, track._id || track.id)}
                        index={idx + 1}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Browse Genres */}
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-white">Browse all</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {[
                    { title: "Pop", color: "from-pink-500 to-rose-500" },
                    { title: "Hip-Hop", color: "from-orange-500 to-red-500" },
                    { title: "Rock", color: "from-purple-500 to-indigo-500" },
                    { title: "Jazz", color: "from-blue-500 to-cyan-500" },
                    { title: "Classical", color: "from-green-500 to-emerald-500" },
                    { title: "Electronic", color: "from-yellow-500 to-orange-500" }
                  ].map((genre, idx) => (
                    <div key={idx} className={`overflow-hidden rounded-3xl bg-gradient-to-br ${genre.color} shadow-xl shadow-black/30 transition hover:shadow-2xl hover:-translate-y-1 p-5 h-28 flex items-end cursor-pointer group glass-card`}>
                      <h3 className="text-white font-semibold text-lg group-hover:scale-105 transition-transform">{genre.title}</h3>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    );
  };

  const LibraryView = () => {
    const [selectedPlaylist, setSelectedPlaylist] = useState(null);
    const [showPlaylistTracks, setShowPlaylistTracks] = useState(false);

    return (
      <ScrollArea className="flex-1">
        <div className="p-6 md:p-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-4xl font-semibold text-white">Your Library</h1>
              <p className="text-slate-500 mt-2">{recentTracks.length} songs in your collection</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setSelectedPlaylist(null)}
                className="glass-button-dark rounded-full px-5 py-3 text-slate-300 hover:text-white"
              >
                <Music size={16} className="mr-2" />
                All tracks
              </Button>
            </div>
          </div>

          {/* Playlists Section */}
          {playlists.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-white">Your Playlists</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-white"
                  onClick={() => {
                    const name = prompt('Enter playlist name:');
                    if (name) createPlaylist(name);
                  }}
                >
                  <Plus size={16} className="mr-1" />
                  New
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    onClick={() => {
                      setSelectedPlaylist(playlist);
                      setShowPlaylistTracks(true);
                    }}
                    className="group cursor-pointer overflow-hidden glass-card-dark shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all p-4 rounded-3xl"
                  >
                    <div className="flex items-center justify-center h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-3">
                      <ListMusic size={48} className="text-white/80" />
                    </div>
                    <h3 className="text-white font-semibold truncate">{playlist.name}</h3>
                    <p className="text-slate-400 text-sm">{playlist.track_count || 0} songs</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tracks */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">
              {selectedPlaylist ? selectedPlaylist.name : 'All Tracks'}
            </h2>
            {recentTracks.length > 0 ? (
              <div className="grid gap-4">
                {recentTracks.map((track, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleTrackSelect(track)}
                    className="group flex flex-col gap-4 overflow-hidden glass-card-dark p-4 hover:-translate-y-1 hover:shadow-2xl cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative h-20 w-20 overflow-hidden rounded-2xl ring-1 ring-white/20 flex-shrink-0">
                        <img
                          src={track.artwork_url}
                          alt={track.title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          {isPlaying && currentTrack?.id === track.id ? (
                            <Pause size={20} className="text-white" />
                          ) : (
                            <Play size={20} className="text-white" />
                          )}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-white text-lg font-semibold truncate">{track.title}</h3>
                        <p className="text-slate-400 truncate">{track.artist}</p>
                        <p className="text-slate-500 text-sm mt-1">{track.album || 'Single'}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-slate-400 text-sm">{formatTime(track.duration || 0)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleToggleFavorite(e, track._id || track.id)}
                          className="rounded-full p-2"
                        >
                          <Heart
                            size={18}
                            fill={isFavorite(track._id || track.id) ? 'currentColor' : 'none'}
                            className={isFavorite(track._id || track.id) ? 'text-red-500' : ''}
                          />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card-dark p-12 text-center border-dashed border-2">
                <Library size={48} className="mx-auto mb-4 text-slate-500" />
                <h3 className="text-white text-xl font-semibold mb-2">Your library is empty</h3>
                <p className="text-slate-400 mb-6">Upload tracks or add music from YouTube to build your collection.</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Button onClick={() => setShowUploadDialog(true)} className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 rounded-full px-5 py-3">Upload Music</Button>
                  <Button onClick={() => setShowYouTubeSearch(true)} className="glass-button-dark rounded-full px-5 py-3 text-white">Search YouTube</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    );
  };

  const FullPlayerView = () => (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-black via-slate-950 to-black text-white">
      <div className="relative h-full flex flex-col">
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/15 glass-surface-dark">
          <button
            onClick={() => setIsFullPlayer(false)}
            className="rounded-full p-3 text-slate-100 glass-button-dark hover:glass-hover-dark"
          >
            <X size={22} />
          </button>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-slate-200 hover:text-white">
              <Shuffle size={18} />
            </Button>
            <Button variant="ghost" size="sm" className="text-slate-200 hover:text-white">
              <MoreVertical size={18} />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-8">
            <div className="w-[88vw] max-w-[420px] rounded-[3rem] overflow-hidden shadow-2xl shadow-white/20 ring-1 ring-white/30">
              <img src={currentTrack.artwork_url} alt={currentTrack.title} className="w-full h-full object-cover" />
            </div>

            <div className="text-center space-y-4">
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Now playing</p>
              <h2 className="text-4xl font-semibold text-white">{currentTrack.title}</h2>
              <p className="text-slate-400 text-lg">{currentTrack.artist}</p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button className="glass-button-dark rounded-full px-5 py-3 text-white hover:glass-hover-dark">Lyrics</button>
              <button className="glass-button-dark rounded-full px-5 py-3 text-white hover:glass-hover-dark">Share</button>
              <button className="glass-button-dark rounded-full px-5 py-3 text-white hover:glass-hover-dark">Spotify</button>
            </div>

            <div className="w-full max-w-xl glass-dark rounded-2xl p-5">
              <div className="flex items-center justify-between text-slate-400 text-sm mb-4">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <Slider
                value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
                onValueChange={(value) => seek((value[0] / 100) * duration)}
                max={100}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() => setShuffle(!shuffle)}
                className={`rounded-full p-4 glass-button-dark ${shuffle ? 'bg-emerald-500/30 text-emerald-300' : ''}`}
              >
                <Shuffle size={20} />
              </button>
              <button
                onClick={playPrevious}
                className="rounded-full p-4 glass-button-dark"
              >
                <SkipBack size={24} />
              </button>
              <button
                onClick={togglePlayPause}
                className="rounded-full bg-gradient-to-r from-white to-slate-100 p-5 shadow-xl shadow-white/20 text-slate-950 hover:scale-[1.02] transition font-bold"
              >
                {isPlaying ? <Pause size={28} /> : <Play size={28} />}
              </button>
              <button
                onClick={playNext}
                className="rounded-full p-4 glass-button-dark"
              >
                <SkipForward size={24} />
              </button>
              <button
                onClick={toggleRepeat}
                className={`rounded-full p-4 glass-button-dark ${repeat !== 'none' ? 'bg-emerald-500/30 text-emerald-300' : ''}`}
              >
                <Repeat size={20} />
              </button>
            </div>

            <div className="w-full max-w-xl glass-dark rounded-2xl p-4 flex items-center gap-3">
              <Volume2 size={18} className="text-slate-400" />
              <Slider
                value={[volume]}
                onValueChange={(value) => setVolume(value[0])}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-slate-400 text-sm">{volume}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const BottomPlayerBar = () => (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/15 glass-surface-dark p-4 shadow-2xl shadow-black/40">
      <div className="mx-auto flex max-w-6xl items-center gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setIsFullPlayer(true)}
            className="h-16 w-16 rounded-2xl overflow-hidden ring-1 ring-white/20 shadow-lg shadow-white/10 hover:ring-white/40 transition"
          >
            <img src={currentTrack.artwork_url} alt={currentTrack.title} className="h-full w-full object-cover" />
          </button>
          <div className="min-w-0">
            <p className="text-sm text-slate-400">Now playing</p>
            <h3 className="text-base font-semibold text-white truncate">{currentTrack.title}</h3>
            <p className="text-xs text-slate-500 truncate">{currentTrack.artist}</p>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-center gap-3 mb-3">
            <button
              onClick={() => setShuffle(!shuffle)}
              className={`rounded-full p-3 glass-button-dark ${shuffle ? 'bg-emerald-500/30 text-emerald-300' : ''}`}
            >
              <Shuffle size={16} />
            </button>
            <button onClick={playPrevious} className="rounded-full glass-button-dark p-3">
              <SkipBack size={16} />
            </button>
            <button onClick={togglePlayPause} className="rounded-full bg-gradient-to-r from-white to-slate-100 p-3 text-slate-950 shadow-lg shadow-white/20">
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button onClick={playNext} className="rounded-full glass-button-dark p-3">
              <SkipForward size={16} />
            </button>
            <button
              onClick={toggleRepeat}
              className={`rounded-full p-3 glass-button-dark ${repeat !== 'none' ? 'bg-emerald-500/30 text-emerald-300' : ''}`}
            >
              <Repeat size={16} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">{formatTime(currentTime)}</span>
            <Slider
              value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
              onValueChange={(value) => seek((value[0] / 100) * duration)}
              max={100}
              step={0.1}
              className="flex-1"
            />
            <span className="text-xs text-slate-500">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Volume2 size={18} className="text-slate-400" />
          <Slider
            value={[volume]}
            onValueChange={(value) => setVolume(value[0])}
            max={100}
            step={1}
            className="w-32"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-slate-950 text-white flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0" onTouchStart={handleSwipeStart} onTouchEnd={handleSwipeEnd}>
        {/* Header */}
        <div className="glass-surface-dark p-6 border-b border-white/15">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="text-slate-400 hover:text-white"
              >
                <Menu size={20} />
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.history.back()}
                  className="text-slate-400 hover:text-white rounded-full w-8 h-8 p-0"
                >
                  <ArrowLeft size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.history.forward()}
                  className="text-slate-400 hover:text-white rounded-full w-8 h-8 p-0"
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowKeyboardHelp(true)}
                className="text-slate-400 hover:text-white rounded-full w-8 h-8 p-0"
                title="Keyboard shortcuts"
              >
                <HelpCircle size={18} />
              </Button>
              <Button className="glass-button rounded-full px-4 py-2 text-sm font-medium">
                Upgrade
              </Button>
              <div className="w-8 h-8 bg-gradient-to-br from-white/20 to-white/10 rounded-full flex items-center justify-center ring-1 ring-white/20">
                <User size={16} className="text-slate-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className={`flex-1 flex flex-col min-w-0 overflow-hidden view-transition-${transitionDirection}`}>
          {currentView === 'home' && <HomeView />}
          {currentView === 'search' && <SearchView />}
          {currentView === 'library' && <LibraryView />}
        </div>

        {/* Bottom Player Bar */}
        {currentTrack && <BottomPlayerBar />}
      </div>

      {/* Full Player Overlay */}
      {isFullPlayer && currentTrack && <FullPlayerView />}

      {/* Upload Dialog */}
      <FileUploadDialog
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onUploadComplete={handleUploadComplete}
        onLocalPlay={handleLocalFilePlay}
      />

      {/* YouTube Search Dialog */}
      <YouTubeSearch
        isOpen={showYouTubeSearch}
        onClose={() => setShowYouTubeSearch(false)}
        onTrackSelect={handleYouTubeTrackSelect}
      />

      {/* Home Settings Dialog */}
      <Dialog open={showHomeSettings} onOpenChange={setShowHomeSettings}>
        <DialogContent className="glass-card border-white/20 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Customize Home Screen</DialogTitle>
            <DialogDescription className="text-white/70">
              Toggle and reorder the sections that appear on your home screen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {homeModules.map((module, index) => (
              <div key={module.id} className="flex items-center justify-between p-3 glass-surface rounded-lg">
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={module.enabled}
                    onCheckedChange={(checked) => {
                      const newModules = [...homeModules];
                      newModules[index] = { ...newModules[index], enabled: checked };
                      saveHomeModules(newModules);
                    }}
                  />
                  <span className={`text-sm font-medium ${module.enabled ? 'text-white' : 'text-white/50'}`}>
                    {module.label}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveHomeModule(index, -1)}
                    disabled={index === 0}
                    className="text-white/70 hover:text-white hover:bg-white/10"
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveHomeModule(index, 1)}
                    disabled={index === homeModules.length - 1}
                    className="text-white/70 hover:text-white hover:bg-white/10"
                  >
                    ↓
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => saveHomeModules(HOME_MODULE_DEFAULTS)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Reset to Default
            </Button>
            <Button
              onClick={() => setShowHomeSettings(false)}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Keyboard Shortcuts Dialog */}
      <Dialog open={showKeyboardHelp} onOpenChange={setShowKeyboardHelp}>
        <DialogContent className="glass-card border-white/20 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Keyboard Shortcuts</DialogTitle>
            <DialogDescription className="text-white/70">
              Learn how to control the player with your keyboard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {[
              { key: 'Space', action: 'Play / Pause' },
              { key: 'N or →', action: 'Next Track' },
              { key: 'P or ←', action: 'Previous Track' },
              { key: 'S', action: 'Toggle Shuffle' },
              { key: 'R', action: 'Toggle Repeat' },
              { key: '↑', action: 'Increase Volume' },
              { key: '↓', action: 'Decrease Volume' },
              { key: 'M', action: 'Mute / Unmute' },
            ].map((shortcut, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                <span className="text-slate-400">{shortcut.action}</span>
                <kbd className="px-3 py-1 bg-white/10 text-white text-sm rounded font-mono border border-white/20">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
};

export default ResonanceApp;