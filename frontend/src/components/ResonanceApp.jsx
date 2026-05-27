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
  Sun,
  Moon,
  Bell,
  Cloud,
} from 'lucide-react';
import { trackAPI, handleApiError, recommendationsAPI, playlistAPI, youtubeAPI } from '../services/api';
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

const VIEW_ORDER = ['home', 'search', 'library', 'favorites'];

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('App caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#030306] text-white p-6">
          <div className="max-w-md text-center glass-card-dark p-8">
            <h1 className="text-3xl font-semibold mb-4">Something went wrong</h1>
            <p className="text-[#888890] mb-6">The app encountered an issue, but you can reload to continue.</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-play text-[#030306] rounded-full px-6 py-3 font-semibold"
            >
              Reload app
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const ResonanceApp = () => {
  const [currentView, setCurrentView] = useState('home');
  const [transitionDirection, setTransitionDirection] = useState('fade');
  const [swipeStartX, setSwipeStartX] = useState(null);
  const [isFullPlayer, setIsFullPlayer] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [githubAvatar, setGithubAvatar] = useState('');
  const [recentTracks, setRecentTracks] = useState([]);
  const [libraryTracks, setLibraryTracks] = useState([]);
  const [trendingTracks, setTrendingTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(true);
  const [globalError, setGlobalError] = useState('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showYouTubeSearch, setShowYouTubeSearch] = useState(false);
  const [showHomeSettings, setShowHomeSettings] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [showPlaylistDialog, setShowPlaylistDialog] = useState(false);
  const [playlistTrackTarget, setPlaylistTrackTarget] = useState(null);
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('resonanceTheme') || 'dark';
    }
    return 'dark';
  });
  const [carMode, setCarMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('resonanceCarMode') || 'false');
    }
    return false;
  });
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('resonanceNotificationsEnabled') || 'false');
    }
    return false;
  });
  const [syncEnabled, setSyncEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('resonanceSyncEnabled') || 'true');
    }
    return true;
  });
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
  const { favorites, isFavorite, toggleFavorite } = useFavoritesContext();
  const { playlists, createPlaylist } = usePlaylistContext();
  const {
    searchResults,
    searchArtistResults,
    searchHistory,
    isSearching: isSearching_hook,
    searchTracks,
    searchArtists,
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
    isOnline,
  } = useAudioPlayer(trackAPI, youtubeAPI);

  // Fetch GitHub avatar
  useEffect(() => {
    if (!isOnline) return;
    fetch('https://api.github.com/users/Moodstlbn')
      .then(res => res.json())
      .then(data => setGithubAvatar(data.avatar_url))
      .catch(() => setGithubAvatar('https://github.com/Moodstlbn.png'));
  }, [isOnline]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
    document.documentElement.dataset.theme = theme;
    if (typeof window !== 'undefined') {
      localStorage.setItem('resonanceTheme', theme);
    }
  }, [theme]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('resonanceCarMode', JSON.stringify(carMode));
    }
  }, [carMode]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (!notificationsEnabled) {
      setNotificationPermission('default');
      return;
    }

    const resolvePermission = (permission) => setNotificationPermission(permission);

    if (Notification.permission === 'default') {
      const requestResult = Notification.requestPermission(resolvePermission);
      if (requestResult && typeof requestResult.then === 'function') {
        requestResult.then(resolvePermission).catch(() => setNotificationPermission('denied'));
      }
    } else {
      setNotificationPermission(Notification.permission);
    }
  }, [notificationsEnabled]);

  useEffect(() => {
    if (typeof window === 'undefined' || !currentTrack || notificationPermission !== 'granted' || !notificationsEnabled) return;
    try {
      new Notification(currentTrack.title, {
        body: `Now playing ${currentTrack.artist}`,
        icon: currentTrack.artwork_url,
      });
    } catch (error) {
      console.warn('Notification blocked or unsupported', error);
    }
  }, [currentTrack, notificationPermission, notificationsEnabled]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('resonanceNotificationsEnabled', JSON.stringify(notificationsEnabled));
  }, [notificationsEnabled]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('resonanceSyncEnabled', JSON.stringify(syncEnabled));
  }, [syncEnabled]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!syncEnabled) return;

    const storedState = window.localStorage.getItem('resonance-player-state');
    if (storedState) {
      try {
        const remoteState = JSON.parse(storedState);
        if (remoteState.theme && remoteState.theme !== theme) {
          setTheme(remoteState.theme);
        }
        if (typeof remoteState.carMode === 'boolean' && remoteState.carMode !== carMode) {
          setCarMode(remoteState.carMode);
        }
      } catch {
        // ignore invalid saved state
      }
    }
  }, [syncEnabled]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorage = (event) => {
      if (!syncEnabled) return;
      if (event.key !== 'resonance-player-state' || !event.newValue) return;
      try {
        const remoteState = JSON.parse(event.newValue);
        if (remoteState.theme && remoteState.theme !== theme) {
          setTheme(remoteState.theme);
        }
        if (typeof remoteState.carMode === 'boolean' && remoteState.carMode !== carMode) {
          setCarMode(remoteState.carMode);
        }
      } catch {
        // ignore invalid sync payloads
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [theme, carMode, syncEnabled]);

  useEffect(() => {
    if (typeof window === 'undefined' || !syncEnabled) return;
    localStorage.setItem(
      'resonance-player-state',
      JSON.stringify({
        theme,
        carMode,
        currentTrackId: currentTrack?._id || currentTrack?.id,
        isPlaying,
        queueIds: queue.map((track) => track._id || track.id || track.title),
      })
    );
  }, [theme, carMode, currentTrack, isPlaying, queue, syncEnabled]);

  const initializeApp = async () => {
    setGlobalError('');
    setGlobalLoading(true);

    try {
      if (isOnline) {
        await Promise.all([
          loadRecentTracks({ suppressToast: true }),
          loadLibraryTracks(),
          loadTrendingTracks(),
        ]);
      } else {
        // Load from offline storage
        const { getOfflineTracks } = await import('../lib/offlineStorage');
        const offlineTracks = await getOfflineTracks();
        setLibraryTracks(offlineTracks);
        setRecentTracks(offlineTracks.slice(0, 20));
        toast({
          title: "Offline Mode",
          description: "You are currently offline. Showing only downloaded tracks.",
        });
      }
    } catch (error) {
      if (isOnline) {
        const errorInfo = handleApiError(error);
        setGlobalError(errorInfo.message || 'Unable to load your music experience.');
      } else {
        console.error('Failed to load offline tracks:', error);
      }
    } finally {
      setGlobalLoading(false);
    }
  };

  useEffect(() => {
    initializeApp();
  }, [isOnline]);

  const loadRecentTracks = async ({ suppressToast = false } = {}) => {
    setIsLoading(true);
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('resonanceCachedTracks');
      if (cached) {
        try {
          setRecentTracks(JSON.parse(cached));
        } catch {
          // ignore invalid cache
        }
      }
    }

    try {
      const tracks = await trackAPI.getRecentTracks(20);
      setRecentTracks(tracks);
      if (typeof window !== 'undefined') {
        localStorage.setItem('resonanceCachedTracks', JSON.stringify(tracks));
      }
    } catch (error) {
      const errorInfo = handleApiError(error);
      if (!suppressToast) {
        toast({
          title: "Failed to load tracks",
          description: errorInfo.message,
          variant: "destructive"
        });
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loadLibraryTracks = async () => {
    try {
      const tracks = await trackAPI.getTracks({ limit: 200 });
      setLibraryTracks(tracks);
    } catch (error) {
      console.error('Failed to load library tracks:', error);
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

  const TrackCard = ({ track, onPlay, onFavorite, onAddToPlaylist, index, showArtist = true }) => (
    <div
      onClick={() => onPlay(track)}
      className="group cursor-pointer overflow-hidden glass-card-dark shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all"
    >
      <div className="aspect-square overflow-hidden relative">
        <img src={track.artwork_url} alt={track.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
          <Button size="sm" className="btn-play text-[#030306] hover:bg-slate-100 rounded-full p-2" onClick={(e) => { e.stopPropagation(); onPlay(track); }}>
            <Play size={16} />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full p-2"
            onClick={(e) => {
              e.stopPropagation();
              onFavorite(track._id || track.id);
            }}
          >
            <Heart size={16} fill={isFavorite(track._id || track.id) ? 'currentColor' : 'none'} />
          </Button>
          {onAddToPlaylist && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-full p-2"
              onClick={(e) => {
                e.stopPropagation();
                onAddToPlaylist(track);
              }}
            >
              <Plus size={16} />
            </Button>
          )}
        </div>
      </div>
      <div className="p-4 space-y-1 backdrop-blur-xl">
        <p className="text-xs text-[#888890]">{index || ''}</p>
        <h3 className="text-[#EBEBED] font-semibold truncate">{track.title}</h3>
        {showArtist && <p className="text-[#888890] text-sm truncate">{track.artist}</p>}
        <p className="text-[#55555E] text-xs">{formatTime(track.duration || 0)}</p>
      </div>
    </div>
  );

  class SmoothMusicScroller {
    constructor(container, renderCallback) {
      this.container = container;
      this.renderCallback = renderCallback;
      this.itemHeight = 112;
      this.buffer = 8;
      this.totalItems = 0;
      this.currentScroll = 0;
      this.targetScroll = 0;
      this.velocity = 0;
      this.isAnimating = false;
      this.lastWheelTime = 0;
      this.scrollPriorityBoost = 1.8;
      this.frameRequested = false;
      this.onWheel = this.onWheel.bind(this);
      this.onNativeScroll = this.onNativeScroll.bind(this);
      this.setup();
    }

    setup() {
      this.container.style.willChange = 'transform';
      this.container.style.transform = 'translateZ(0)';
      this.container.addEventListener('wheel', this.onWheel, { passive: false });
      this.container.addEventListener('scroll', this.onNativeScroll, { passive: true });
      this.updateVisibleItems();
    }

    setItems(count) {
      this.totalItems = count;
      this.updateVisibleItems();
    }

    onWheel(e) {
      e.preventDefault();
      const now = performance.now();
      const rapidScroll = now - this.lastWheelTime < 40;
      this.lastWheelTime = now;
      const multiplier = rapidScroll ? this.scrollPriorityBoost : 1;
      const delta = e.deltaY * multiplier;
      this.velocity += delta * 0.15;
      this.velocity = Math.max(-120, Math.min(120, this.velocity));
      if (!this.isAnimating) {
        this.animate();
      }
    }

    onNativeScroll() {
      this.targetScroll = this.container.scrollTop;
      this.updateVisibleItems();
    }

    animate() {
      this.isAnimating = true;
      const step = () => {
        this.velocity *= 0.88;
        if (Math.abs(this.velocity) < 0.08) {
          this.velocity = 0;
          this.isAnimating = false;
          return;
        }

        this.targetScroll += this.velocity;
        const maxScroll = Math.max(0, this.totalItems * this.itemHeight - this.container.clientHeight);
        this.targetScroll = Math.max(0, Math.min(maxScroll, this.targetScroll));
        this.currentScroll += (this.targetScroll - this.currentScroll) * 0.22;
        this.container.scrollTop = this.currentScroll;
        this.updateVisibleItems();
        requestAnimationFrame(step);
      };

      requestAnimationFrame(step);
    }

    updateVisibleItems() {
      if (this.frameRequested) return;
      this.frameRequested = true;
      requestAnimationFrame(() => {
        const height = this.container.clientHeight;
        const startIndex = Math.max(0, Math.floor(this.container.scrollTop / this.itemHeight) - this.buffer);
        const visibleCount = Math.ceil(height / this.itemHeight) + this.buffer * 2;
        const endIndex = Math.min(this.totalItems, startIndex + visibleCount);
        this.renderCallback(startIndex, endIndex);
        this.frameRequested = false;
      });
    }

    destroy() {
      this.container.removeEventListener('wheel', this.onWheel);
      this.container.removeEventListener('scroll', this.onNativeScroll);
    }
  }

  const LibraryTrackVirtualList = ({ tracks }) => {
    const [range, setRange] = useState({ start: 0, end: Math.min(14, tracks.length) });
    const listRef = useRef(null);
    const itemHeight = 112;

    useEffect(() => {
      if (!listRef.current) return;
      const scroller = new SmoothMusicScroller(listRef.current, (start, end) => setRange({ start, end }));
      scroller.setItems(tracks.length);
      setRange({ start: 0, end: Math.min(14, tracks.length) });
      return () => scroller.destroy();
    }, [tracks.length]);

    const totalHeight = tracks.length * itemHeight;
    const offsetY = range.start * itemHeight;

    return (
      <div
        ref={listRef}
        className="relative overflow-y-auto h-[64vh] rounded-3xl border border-[rgba(200,200,204,0.08)] bg-black/30 backdrop-blur-xl"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div style={{ height: totalHeight }} />
        <div className="absolute inset-x-0" style={{ transform: `translateY(${offsetY}px)` }}>
          {tracks.slice(range.start, range.end).map((track, idx) => (
            <div
              key={track.id || track._id || range.start + idx}
              onClick={() => handleTrackSelect(track)}
              className="group flex flex-col gap-4 overflow-hidden glass-card-dark p-4 hover:-translate-y-1 hover:shadow-2xl cursor-pointer transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 overflow-hidden rounded-2xl ring-1 ring-[rgba(200,200,204,0.15)] flex-shrink-0">
                  <img
                    src={track.artwork_url}
                    alt={track.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    {isPlaying && currentTrack?.id === track.id ? (
                      <Pause size={20} className="text-white" />
                    ) : (
                      <Play size={20} className="text-white" />
                    )}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-white text-lg font-semibold truncate">{track.title}</h3>
                  <p className="text-[#888890] truncate">{track.artist}</p>
                  <p className="text-[#55555E] text-sm mt-1">{track.album || 'Single'}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-[#888890] text-sm">{formatTime(track.duration || 0)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(track._id || track.id);
                    }}
                    className="rounded-full p-2"
                  >
                    <Heart
                      size={18}
                      fill={isFavorite(track._id || track.id) ? 'currentColor' : 'none'}
                      className={isFavorite(track._id || track.id) ? 'text-[#CC2020]' : ''}
                    />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleUploadComplete = (uploadedTracks) => {
    setRecentTracks(prev => [...uploadedTracks, ...prev].slice(0, 20));
    setLibraryTracks(prev => [...uploadedTracks, ...prev]);
    setShowUploadDialog(false);
  };

  const handleLocalFilePlay = (track) => {
    setRecentTracks(prev => [track, ...prev].slice(0, 20));
    setLibraryTracks(prev => [track, ...prev]);
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

  const getQueueForCurrentView = () => {
    if (currentView === 'search' && searchResults.length > 0) return searchResults;
    if (currentView === 'favorites' && favorites.length > 0) return favorites;
    if (currentView === 'library' && libraryTracks.length > 0) return libraryTracks;
    return recentTracks;
  };

  const handleYouTubeTrackSelect = (track) => {
    setRecentTracks(prev => [track, ...prev].slice(0, 20));
    setLibraryTracks(prev => [track, ...prev]);
    playTrack(track, [track, ...recentTracks]);
    setShowYouTubeSearch(false);
  };

  const handleTrackSelect = (track) => {
    playTrack(track, getQueueForCurrentView());
  };

  const handleToggleFavorite = async (trackId) => {
    try {
      const added = await toggleFavorite(trackId);
      toast({
        title: 'Favorites updated',
        description: added
          ? 'Track added to your favorites.'
          : 'Track removed from your favorites.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update favorite status.',
        variant: 'destructive',
      });
    }
  };

  const handleOpenPlaylistDialog = (track) => {
    setPlaylistTrackTarget(track);
    setShowPlaylistDialog(true);
  };

  const handleAddTrackToPlaylist = async (playlistId) => {
    if (!playlistTrackTarget) return;
    try {
      await playlistAPI.addTrackToPlaylist(playlistId, playlistTrackTarget._id || playlistTrackTarget.id);
      toast({
        title: 'Added to playlist',
        description: `${playlistTrackTarget.title} was added to your playlist.`,
      });
      setShowPlaylistDialog(false);
      setPlaylistTrackTarget(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not add track to playlist.',
        variant: 'destructive',
      });
    }
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
    { id: 'favorites', label: 'Favorites', icon: Heart },
  ];

  const Sidebar = () => (
    <div className={`${sidebarCollapsed ? 'w-20' : 'w-72'} h-full glass-surface-dark border-r border-[rgba(200,200,204,0.1)] text-[#EBEBED] flex flex-col transition-all duration-300`}> 
      <div className="p-4 md:p-6 border-b border-[rgba(200,200,204,0.08)] glass-surface-dark">
        <div className="flex items-center gap-3">
          {githubAvatar && (
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl overflow-hidden ring-1 ring-[rgba(200,200,204,0.15)] shadow-lg shadow-white/10">
              <img src={githubAvatar} alt="Resonance" className="w-full h-full object-cover" />
            </div>
          )}
          {!sidebarCollapsed && (
            <div className="animate-in fade-in slide-in-from-left-2 duration-300">
              <h1 className="font-display text-xl md:text-2xl tracking-[0.08em] text-[#EBEBED]">RESONANCE</h1>
              <p className="text-[9px] uppercase tracking-[0.5em] text-[#55555E] mt-0.5">PLAYER</p>
            </div>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-5">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                    setSidebarCollapsed(true);
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 ${
                  currentView === item.id
                    ? 'glass-surface text-[#EBEBED] shadow-lg'
                    : 'text-[#888890] hover:text-white hover:glass-surface-dark'
                }`}
              >
                <Icon size={22} />
                {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            );
          })}

          <div className="mt-8 space-y-2">
            <div className="px-4 pb-2">
              {!sidebarCollapsed && <h3 className="text-[9px] uppercase tracking-[0.5em] text-[#3D3D45]">Library</h3>}
            </div>
            <button
              onClick={() => setShowUploadDialog(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[#C8C8CC] hover:text-white glass-button-dark"
            >
              <Plus size={22} />
              {!sidebarCollapsed && <span className="text-sm font-medium">Add Music</span>}
            </button>
            <button
              onClick={() => setShowYouTubeSearch(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[#C8C8CC] hover:text-white glass-button-dark"
            >
              <Youtube size={22} />
              {!sidebarCollapsed && <span className="text-sm font-medium">YouTube</span>}
            </button>
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-[rgba(200,200,204,0.08)] glass-surface-dark">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[rgba(200,200,204,0.08)] rounded-2xl flex items-center justify-center ring-1 ring-[rgba(200,200,204,0.15)] backdrop-blur-md">
            <User size={16} className="text-[#AAAAAE]" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">Guest User</p>
              <p className="text-[#55555E] text-xs truncate">Free account</p>
            </div>
          )}
          {!sidebarCollapsed && (
            <Button variant="ghost" size="sm" className="text-[#AAAAAE] hover:text-white">
              <Settings size={16} />
            </Button>
          )}
        </div>
      </div>

      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="absolute top-1/2 -right-4 z-10 w-9 h-9 glass-button-dark hover:glass-hover-dark rounded-full flex items-center justify-center text-[#AAAAAE] hover:text-white"
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
            <p className="text-xs uppercase tracking-[0.5em] text-[#55555E]">Good evening</p>
            <h1 className="text-4xl md:text-5xl font-semibold text-[#EBEBED] tracking-tight">Your music, your mood.</h1>
            <p className="max-w-2xl text-[#55555E]">Stream your library, continue listening, and manage playlists with a premium player feel across every view.</p>
          </div>
          <Button variant="outline" onClick={openHomeSettings} className="glass-button rounded-full px-5 py-3 text-[#AAAAAE] hover:text-[#EBEBED] cursor-pointer">
            Customize home
          </Button>
        </div>

        {homeModules.find((module) => module.id === 'nowPlaying')?.enabled && currentTrack && (
          <div className="glass-card-dark overflow-hidden shadow-2xl">
            <div className="grid gap-6 md:grid-cols-[280px_1fr] items-center p-6">
              <div className="rounded-[2rem] overflow-hidden shadow-xl shadow-white/10 ring-1 ring-[rgba(200,200,204,0.15)]">
                <img src={currentTrack.artwork_url} alt={currentTrack.title} className="w-full h-full object-cover" />
              </div>

              <div className="space-y-5">
                <div>
                  <h2 className="text-xs uppercase tracking-[0.5em] text-[#55555E]">Now Playing</h2>
                  <h3 className="text-3xl font-semibold text-white mt-3">{currentTrack.title}</h3>
                  <p className="text-[#888890] mt-2">{currentTrack.artist}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button variant="secondary" className="btn-play rounded-full px-5 py-3">Play</Button>
                  <Button variant="outline" className="rounded-full px-5 py-3 glass-button-dark">Queue</Button>
                  <Button variant="ghost" className="rounded-full px-5 py-3 text-white/80">Share</Button>
                </div>

                <div className="glass-dark rounded-2xl p-4">
                  <div className="flex items-center justify-between text-[#888890] text-sm mb-3">
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
                <p className="text-[#55555E]">Tap to continue listening to your latest tracks.</p>
              </div>
              <Button variant="ghost" className="text-[#AAAAAE] hover:text-white">Show all</Button>
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
                    onFavorite={() => handleToggleFavorite(track._id || track.id)}
                    onAddToPlaylist={handleOpenPlaylistDialog}
                    index={idx + 1}
                  />
                ))}
              </div>
            ) : (
              <div className="glass-card-dark p-12 text-center border-dashed border-2">
                <Music size={48} className="mx-auto mb-4 text-[#55555E]" />
                <h3 className="text-white text-xl font-semibold mb-2">No music yet</h3>
                <p className="text-[#888890] mb-6">Upload a track or search YouTube to start streaming.</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Button onClick={() => setShowUploadDialog(true)} className="bg-gradient-to-r from-[#C49A28] to-[#8B6B1A] text-white hover:from-[#D4AA38] hover:to-[#9A7820] rounded-full px-5 py-3">Upload Music</Button>
                  <Button onClick={() => setShowYouTubeSearch(true)} className="glass-button-dark rounded-full px-5 py-3 text-white">YouTube Search</Button>
                </div>
              </div>
            )}
            {queue.length > 0 && (
              <div className="glass-card-dark p-6 mt-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 text-[#888890] text-sm uppercase tracking-[0.3em]">
                      <ListMusic size={16} />
                      <span>Play Queue</span>
                    </div>
                    <h3 className="text-xl font-semibold text-white">Up next</h3>
                  </div>
                  <Button variant="ghost" size="sm" onClick={clearQueue} className="text-[#AAAAAE] hover:text-white">
                    Clear queue
                  </Button>
                </div>
                <div className="space-y-3">
                  {queue.map((track, idx) => (
                    <div key={track.id || idx} className="flex items-center justify-between gap-4 glass-dark rounded-2xl p-4">
                      <div>
                        <p className="text-sm text-[#888890]">{idx + 1}. {track.title}</p>
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
                <p className="text-[#888890]">Find playlists, moods, and trends curated for you.</p>
              </div>
              <Button variant="ghost" className="text-[#AAAAAE] hover:text-white">More</Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {[
                { title: "Pop", color: "from-[#CC2020] to-[#881616]" },
                { title: "Hip-Hop", color: "from-[#C49A28] to-[#CC2020]" },
                { title: "Rock", color: "from-[#888890] to-[#55555E]" },
                { title: "Jazz", color: "from-[#3A3A44] to-[#888890]" },
                { title: "Classical", color: "from-[#8B6B1A] to-[#C49A28]" },
                { title: "Electronic", color: "from-[#C49A28] to-[#8B6B1A]" }
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
                <div className="flex items-center gap-2 text-[#888890] text-sm uppercase tracking-[0.3em]">
                  <ListMusic size={16} />
                  <span>Play Queue</span>
                </div>
                <h3 className="text-xl font-semibold text-white">Up next</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={clearQueue} className="text-[#AAAAAE] hover:text-white">
                Clear queue
              </Button>
            </div>
            <div className="space-y-3">
              {queue.map((track, idx) => (
                <div key={track.id || idx} className="flex items-center justify-between gap-4 glass-dark rounded-2xl p-4">
                  <div>
                    <p className="text-sm text-[#888890]">{idx + 1}. {track.title}</p>
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
        searchArtists(query);
      } else {
        clearResults();
      }
    };

    return (
      <ScrollArea className="flex-1">
        <div className="p-6 md:p-8 space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold text-[#EBEBED]">Search your library</h1>
            <div className="max-w-2xl">
              <div className="relative">
                <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#888890]" />
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
                  className="text-[#888890] hover:text-white"
                >
                  Clear all
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((item, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    className="border-[rgba(200,200,204,0.15)] text-[#AAAAAE] hover:text-white rounded-full"
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
                      onFavorite={() => handleToggleFavorite(track._id || track.id)}
                      onAddToPlaylist={handleOpenPlaylistDialog}
                      index={idx + 1}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {searchArtistResults.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-semibold text-white">Artist matches</h2>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {searchArtistResults.map((artist, idx) => (
                          <div key={idx} className="group overflow-hidden rounded-3xl glass-card-dark p-5 hover:-translate-y-1 hover:shadow-2xl transition-all cursor-pointer">
                            <div className="h-32 rounded-3xl bg-slate-900 overflow-hidden mb-4">
                              <img src={artist.sample_artwork || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop'} alt={artist.artist} className="h-full w-full object-cover" />
                            </div>
                            <h3 className="text-white text-lg font-semibold truncate">{artist.artist}</h3>
                            <p className="text-[#888890] text-sm mt-1">{artist.track_count} tracks</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="glass-card-dark p-12 text-center border-dashed border-2">
                      <Search size={48} className="mx-auto mb-4 text-[#55555E]" />
                      <h3 className="text-white text-xl font-semibold mb-2">No results found</h3>
                      <p className="text-[#888890]">Try searching for a different song, artist, or album.</p>
                    </div>
                  )}
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
                        onFavorite={() => handleToggleFavorite(track._id || track.id)}
                        onAddToPlaylist={handleOpenPlaylistDialog}
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
                    { title: "Pop", color: "from-[#CC2020] to-[#881616]" },
                    { title: "Hip-Hop", color: "from-[#C49A28] to-[#CC2020]" },
                    { title: "Rock", color: "from-[#888890] to-[#55555E]" },
                    { title: "Jazz", color: "from-[#3A3A44] to-[#888890]" },
                    { title: "Classical", color: "from-[#8B6B1A] to-[#C49A28]" },
                    { title: "Electronic", color: "from-[#C49A28] to-[#8B6B1A]" }
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

    const displayTracks = selectedPlaylist 
      ? libraryTracks.filter(t => (selectedPlaylist.tracks || []).includes(t.id || t._id))
      : libraryTracks;

    return (
      <ScrollArea className="flex-1">
        <div className="p-6 md:p-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-4xl font-semibold text-white">Your Library</h1>
              <p className="text-[#55555E] mt-2">{libraryTracks.length} songs in your collection</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setSelectedPlaylist(null)}
                className="glass-button-dark rounded-full px-5 py-3 text-[#AAAAAE] hover:text-white"
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
                  className="text-[#888890] hover:text-white"
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
                    <div className="flex items-center justify-center h-32 bg-gradient-to-br from-[#C49A28] to-[#8B6B1A] rounded-2xl mb-3">
                      <ListMusic size={48} className="text-white/80" />
                    </div>
                    <h3 className="text-[#EBEBED] font-semibold truncate">{playlist.name}</h3>
                    <p className="text-[#888890] text-sm">{playlist.track_count || 0} songs</p>
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
            {displayTracks.length > 0 ? (
              <LibraryTrackVirtualList tracks={displayTracks} />
            ) : (
              <div className="glass-card-dark p-12 text-center border-dashed border-2">
                <Library size={48} className="mx-auto mb-4 text-[#55555E]" />
                <h3 className="text-white text-xl font-semibold mb-2">Your library is empty</h3>
                <p className="text-[#888890] mb-6">Upload tracks or add music from YouTube to build your collection.</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Button onClick={() => setShowUploadDialog(true)} className="bg-gradient-to-r from-[#C49A28] to-[#8B6B1A] text-white hover:from-[#D4AA38] hover:to-[#9A7820] rounded-full px-5 py-3">Upload Music</Button>
                  <Button onClick={() => setShowYouTubeSearch(true)} className="glass-button-dark rounded-full px-5 py-3 text-white">Search YouTube</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    );
  };

  const FavoritesView = () => (
    <ScrollArea className="flex-1">
      <div className="p-6 md:p-8 space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold text-white">Favorites</h1>
            <p className="text-[#55555E] mt-2">{favorites.length} tracks you love.</p>
          </div>
          <Button
            variant="outline"
            className="glass-button-dark rounded-full px-5 py-3 text-[#AAAAAE] hover:text-white"
            onClick={() => setCurrentView('library')}
          >
            Browse Library
          </Button>
        </div>

        {favorites.length > 0 ? (
          <div className="grid gap-4">
            {favorites.map((track, idx) => (
              <div
                key={idx}
                onClick={() => handleTrackSelect(track)}
                className="group flex flex-col gap-4 overflow-hidden glass-card-dark p-4 hover:-translate-y-1 hover:shadow-2xl cursor-pointer transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20 overflow-hidden rounded-2xl ring-1 ring-[rgba(200,200,204,0.15)] flex-shrink-0">
                    <img
                      src={track.artwork_url}
                      alt={track.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-white text-lg font-semibold truncate">{track.title}</h3>
                    <p className="text-[#888890] truncate">{track.artist}</p>
                    <p className="text-[#55555E] text-sm mt-1">{track.album || 'Single'}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[#888890] text-sm">{formatTime(track.duration || 0)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleFavorite(track._id || track.id)}
                      className="rounded-full p-2"
                    >
                      <Heart
                        size={18}
                        fill={isFavorite(track._id || track.id) ? 'currentColor' : 'none'}
                        className={isFavorite(track._id || track.id) ? 'text-[#CC2020]' : ''}
                      />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card-dark p-12 text-center border-dashed border-2">
            <Heart size={48} className="mx-auto mb-4 text-[#55555E]" />
            <h3 className="text-white text-xl font-semibold mb-2">No favorites yet</h3>
            <p className="text-[#888890] mb-6">Tap the heart icon on any track to save it here.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={() => setCurrentView('library')} className="bg-gradient-to-r from-[#C49A28] to-[#8B6B1A] text-white hover:from-[#D4AA38] hover:to-[#9A7820] rounded-full px-5 py-3">Go to Library</Button>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );

  const CarModeView = () => (
    <div className="fixed inset-0 z-50 bg-[#030306] text-white p-6 md:p-10 overflow-hidden">
      <div className="h-full flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#888890] uppercase tracking-[0.35em] text-sm">Car mode</p>
              <h1 className="text-4xl font-semibold">Drive Safe</h1>
            </div>
            <button onClick={() => setCarMode(false)} className="rounded-full p-3 glass-button-dark text-[#EBEBED] hover:glass-hover-dark">
              <X size={22} />
            </button>
          </div>
          <div className="mx-auto w-full max-w-md overflow-hidden rounded-[2.5rem] shadow-2xl shadow-white/10 ring-1 ring-[rgba(200,200,204,0.15)]">
            <img src={currentTrack.artwork_url} alt={currentTrack.title} className="w-full h-full object-cover" />
          </div>
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-semibold text-white">{currentTrack.title}</h2>
            <p className="text-[#888890] text-lg">{currentTrack.artist}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-dark rounded-3xl p-6">
            <div className="flex items-center justify-between text-[#888890] text-sm mb-4">
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

          <div className="flex items-center justify-center gap-4">
            <button onClick={playPrevious} className="rounded-full p-5 glass-button-dark">
              <SkipBack size={26} />
            </button>
            <button onClick={togglePlayPause} className="rounded-full bg-white p-5 text-[#030306] shadow-xl shadow-white/20">
              {isPlaying ? <Pause size={28} /> : <Play size={28} />}
            </button>
            <button onClick={playNext} className="rounded-full p-5 glass-button-dark">
              <SkipForward size={26} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const FullPlayerView = () => (
    <div className="fixed inset-0 z-50 bg-[#030306] text-white">
      <div className="relative h-full flex flex-col">
        <div className="flex items-center justify-between px-5 py-5 border-b border-[rgba(200,200,204,0.1)] glass-surface-dark">
          <button
            onClick={() => setIsFullPlayer(false)}
            className="rounded-full p-3 text-[#EBEBED] glass-button-dark hover:glass-hover-dark"
          >
            <X size={22} />
          </button>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-[#C8C8CC] hover:text-white">
              <Shuffle size={18} />
            </Button>
            <Button variant="ghost" size="sm" className="text-[#C8C8CC] hover:text-white">
              <MoreVertical size={18} />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-8">
            <div className="w-[88vw] max-w-[420px] rounded-[3rem] overflow-hidden shadow-2xl shadow-white/20 ring-1 ring-[rgba(200,200,204,0.25)]">
              <img src={currentTrack.artwork_url} alt={currentTrack.title} className="w-full h-full object-cover" />
            </div>

            <div className="text-center space-y-4">
              <p className="text-sm uppercase tracking-[0.35em] text-[#888890]">Now playing</p>
              <h2 className="text-4xl font-semibold text-white">{currentTrack.title}</h2>
              <p className="text-[#888890] text-lg">{currentTrack.artist}</p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button 
                onClick={() => toast({ title: "Lyrics coming soon", description: "This feature is currently under development." })}
                className="glass-button-dark rounded-full px-5 py-3 text-white hover:glass-hover-dark"
              >
                Lyrics
              </button>
              <button 
                onClick={() => toast({ title: "Share coming soon", description: "Sharing features are on our roadmap!" })}
                className="glass-button-dark rounded-full px-5 py-3 text-white hover:glass-hover-dark"
              >
                Share
              </button>
              <button 
                onClick={() => toast({ title: "Spotify integration", description: "Spotify sync is coming in a future update." })}
                className="glass-button-dark rounded-full px-5 py-3 text-white hover:glass-hover-dark"
              >
                Spotify
              </button>
            </div>

            <div className="w-full max-w-xl glass-dark rounded-2xl p-5">
              <div className="flex items-center justify-between text-[#888890] text-sm mb-4">
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
                className={`rounded-full p-4 glass-button-dark ${shuffle ? 'bg-[rgba(196,154,40,0.15)] text-[#C49A28]' : ''}`}
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
                className="rounded-full bg-gradient-to-r from-[#E8E8EC] to-[#C0C0C4] p-5 shadow-xl shadow-white/20 text-[#030306] hover:scale-[1.02] transition font-bold"
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
                className={`rounded-full p-4 glass-button-dark ${repeat !== 'none' ? 'bg-[rgba(196,154,40,0.15)] text-[#C49A28]' : ''}`}
              >
                <Repeat size={20} />
              </button>
            </div>

            <div className="w-full max-w-xl glass-dark rounded-2xl p-4 flex items-center gap-3">
              <Volume2 size={18} className="text-[#888890]" />
              <Slider
                value={[volume]}
                onValueChange={(value) => setVolume(value[0])}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-[#888890] text-sm">{volume}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const BottomPlayerBar = () => (
    <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 z-40 border-t border-[rgba(200,200,204,0.1)] glass-surface-dark p-3 md:p-4 shadow-2xl shadow-black/40">
      <div className="mx-auto flex max-w-7xl items-center gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1 md:flex-initial">
          <button
            onClick={() => setIsFullPlayer(true)}
            className="h-12 w-12 md:h-16 md:w-16 rounded-xl md:rounded-2xl overflow-hidden ring-1 ring-[rgba(200,200,204,0.15)] shadow-lg shadow-white/10 hover:ring-[rgba(200,200,204,0.35)] transition shrink-0"
          >
            <img src={currentTrack.artwork_url} alt={currentTrack.title} className="h-full w-full object-cover" />
          </button>
          <div className="min-w-0">
            <h3 className="text-sm md:text-base font-semibold text-[#EBEBED] truncate">{currentTrack.title}</h3>
            <p className="text-[10px] md:text-xs text-[#55555E] truncate">{currentTrack.artist}</p>
          </div>
        </div>

        <div className="hidden md:flex flex-1 flex-col items-center max-w-2xl">
          <div className="flex items-center justify-center gap-4 mb-2">
            <button
              onClick={() => setShuffle(!shuffle)}
              className={`rounded-full p-2 transition-colors ${shuffle ? 'text-[#C49A28]' : 'text-[#888890] hover:text-white'}`}
            >
              <Shuffle size={16} />
            </button>
            <button onClick={playPrevious} className="text-[#C8C8CC] hover:text-white transition-colors">
              <SkipBack size={18} />
            </button>
            <button onClick={togglePlayPause} className="h-10 w-10 flex items-center justify-center rounded-full btn-play text-[#030306] hover:scale-105 transition active:scale-95 shadow-lg">
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button onClick={playNext} className="text-[#C8C8CC] hover:text-white transition-colors">
              <SkipForward size={18} />
            </button>
            <button
              onClick={toggleRepeat}
              className={`rounded-full p-2 transition-colors ${repeat !== 'none' ? 'text-[#C49A28]' : 'text-[#888890] hover:text-white'}`}
            >
              <Repeat size={16} />
            </button>
          </div>
          <div className="flex items-center gap-3 w-full">
            <span className="text-[10px] tabular-nums text-[#55555E] w-10 text-right">{formatTime(currentTime)}</span>
            <Slider
              value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
              onValueChange={(value) => seek((value[0] / 100) * duration)}
              max={100}
              step={0.1}
              className="flex-1"
            />
            <span className="text-[10px] tabular-nums text-[#55555E] w-10">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="md:hidden flex items-center gap-1">
            <button onClick={togglePlayPause} className="h-10 w-10 flex items-center justify-center rounded-full text-white">
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <button onClick={playNext} className="h-10 w-10 flex items-center justify-center rounded-full text-white">
              <SkipForward size={22} />
            </button>
          </div>
          <div className="hidden lg:flex items-center gap-3">
            <Volume2 size={18} className="text-[#888890]" />
            <Slider
              value={[volume]}
              onValueChange={(value) => setVolume(value[0])}
              max={100}
              step={1}
              className="w-24 xl:w-32"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <AppErrorBoundary>
      {globalLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030306]/95 p-6">
          <div className="max-w-sm w-full glass-card-dark p-8 text-center">
            <div className="mx-auto mb-5 h-14 w-14 rounded-full border-4 border-[rgba(200,200,204,0.15)] border-t-white animate-spin" />
            <h2 className="text-xl font-semibold text-white mb-2">Starting Resonance</h2>
            <p className="text-[#888890]">Loading your library and playback services.</p>
          </div>
        </div>
      )}
      {globalError && !globalLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030306]/95 p-6">
          <div className="max-w-md w-full glass-card-dark p-8 text-center">
            <h2 className="text-2xl font-semibold text-white mb-3">Connection Error</h2>
            <p className="text-[#888890] mb-6">{globalError}</p>
            <div className="flex justify-center gap-3">
              <Button onClick={initializeApp} className="btn-play text-[#030306] rounded-full px-5 py-3">
                Retry
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="h-screen bg-[#030306] text-white flex overflow-hidden">
        {/* Sidebar - Desktop */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Sidebar - Mobile (Sheet) */}
        <Sheet open={!sidebarCollapsed && typeof window !== 'undefined' && window.innerWidth < 1024} onOpenChange={(open) => setSidebarCollapsed(!open)}>
          <SheetContent side="left" className="p-0 w-72 bg-[#030306] border-[rgba(200,200,204,0.1)]">
            <Sidebar />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 relative" onTouchStart={handleSwipeStart} onTouchEnd={handleSwipeEnd}>
          {/* Header */}
          <div className="glass-surface-dark p-4 md:p-6 border-b border-[rgba(200,200,204,0.1)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="text-[#888890] hover:text-white"
                >
                  <Menu size={20} />
                </Button>
                <div className="hidden sm:flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.history.back()}
                    className="text-[#888890] hover:text-white rounded-full w-8 h-8 p-0"
                  >
                    <ArrowLeft size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.history.forward()}
                    className="text-[#888890] hover:text-white rounded-full w-8 h-8 p-0"
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-3">
                <div className="hidden md:flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className={`rounded-full w-8 h-8 p-0 ${theme === 'dark' ? 'text-[#EBEBED]' : 'text-slate-700'}`}
                    title="Toggle dark/light theme"
                  >
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setNotificationsEnabled((prev) => !prev)}
                    className={`rounded-full w-8 h-8 p-0 ${notificationsEnabled ? 'text-[#D4AA38]' : 'text-[#888890] hover:text-white'}`}
                    title="Smart notifications"
                  >
                    <Bell size={18} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSyncEnabled((prev) => !prev)}
                    className={`rounded-full w-8 h-8 p-0 ${syncEnabled ? 'text-[#D4AA38]' : 'text-[#888890] hover:text-white'}`}
                    title="Multi-device sync"
                  >
                    <Cloud size={18} />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCarMode(!carMode)}
                  className="text-[#888890] hover:text-white rounded-full w-8 h-8 p-0"
                  title="Enter car mode"
                >
                  <Music size={18} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowKeyboardHelp(true)}
                  className="hidden md:flex text-[#888890] hover:text-white rounded-full w-8 h-8 p-0"
                  title="Keyboard shortcuts"
                >
                  <HelpCircle size={18} />
                </Button>
                <Button className="btn-amber rounded-full px-4 py-2 text-xs md:text-sm font-medium cursor-pointer">
                  Upgrade
                </Button>
                <div className="w-8 h-8 bg-[rgba(200,200,204,0.08)] rounded-full flex items-center justify-center ring-1 ring-[rgba(200,200,204,0.15)]">
                  <User size={16} className="text-[#AAAAAE]" />
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className={`flex-1 flex flex-col min-w-0 view-transition-${transitionDirection} ${currentTrack ? 'pb-32 md:pb-24' : 'pb-20 lg:pb-0'}`}>
            {currentView === 'home' && <HomeView />}
            {currentView === 'search' && <SearchView />}
            {currentView === 'library' && <LibraryView />}
            {currentView === 'favorites' && <FavoritesView />}
          </div>

          {/* Bottom Navigation (Mobile Only) */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-surface-dark border-t border-[rgba(200,200,204,0.1)] px-6 py-3 flex items-center justify-between">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex flex-col items-center gap-1 transition-colors ${
                    currentView === item.id ? 'text-white' : 'text-[#55555E]'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Bottom Player Bar */}
          {currentTrack && <BottomPlayerBar />}
        </div>

      {/* Full Player Overlay */}
      {carMode && currentTrack ? <CarModeView /> : isFullPlayer && currentTrack ? <FullPlayerView /> : null}

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
        <DialogContent className="glass-card border-[rgba(200,200,204,0.15)] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#EBEBED]">Customize Home Screen</DialogTitle>
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
              className="border-[rgba(200,200,204,0.15)] text-white hover:bg-white/10"
            >
              Reset to Default
            </Button>
            <Button
              onClick={() => setShowHomeSettings(false)}
              className="bg-gradient-to-r from-[#C49A28] to-[#8B6B1A] text-white hover:from-[#D4AA38] hover:to-[#9A7820]"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Keyboard Shortcuts Dialog */}
      <Dialog open={showKeyboardHelp} onOpenChange={setShowKeyboardHelp}>
        <DialogContent className="glass-card border-[rgba(200,200,204,0.15)] max-w-md">
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
                <span className="text-[#888890]">{shortcut.action}</span>
                <kbd className="px-3 py-1 bg-white/10 text-white text-sm rounded font-mono border border-[rgba(200,200,204,0.15)]">
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
    </AppErrorBoundary>
  );
};

export default ResonanceApp;