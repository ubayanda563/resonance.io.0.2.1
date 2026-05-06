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
} from 'lucide-react';
import { trackAPI, handleApiError } from '../services/api';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import FileUploadDialog from './FileUploadDialog';
import YouTubeSearch from './YouTubeSearch';
import Toaster from './Toaster';
import { useToast } from '../hooks/use-toast';
import { mockLibraryData } from '../data/mockData';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Slider } from './ui/slider';
import { ScrollArea } from './ui/scroll-area';

const ResonanceApp = () => {
  const [currentView, setCurrentView] = useState('home');
  const [isFullPlayer, setIsFullPlayer] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [githubAvatar, setGithubAvatar] = useState('');
  const [recentTracks, setRecentTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showYouTubeSearch, setShowYouTubeSearch] = useState(false);
  const { toast } = useToast();

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

  const handleTrackSelect = (track) => {
    playTrack(track, recentTracks);
  };

  const handleUploadComplete = (uploadedTracks) => {
    setRecentTracks(prev => [...uploadedTracks, ...prev].slice(0, 20));
    setShowUploadDialog(false);
  };

  const handleLocalFilePlay = (track) => {
    setRecentTracks(prev => [track, ...prev].slice(0, 20));
    playTrack(track);
    setShowUploadDialog(false);
  };

  const handleYouTubeTrackSelect = (track) => {
    setRecentTracks(prev => [track, ...prev].slice(0, 20));
    playTrack(track);
    setShowYouTubeSearch(false);
  };

  const handleAddToQueue = (track) => {
    addToQueue([track]);
    toast({
      title: 'Added to queue',
      description: `${track.title} has been added to the play queue.`,
    });
  };

  const handleRemoveFromQueue = (index) => {
    removeFromQueue(index);
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
    <div className={`${sidebarCollapsed ? 'w-20' : 'w-72'} relative bg-slate-950/95 border-r border-white/10 backdrop-blur-xl text-slate-100 flex flex-col transition-all duration-300`}> 
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          {githubAvatar && (
            <div className="w-10 h-10 rounded-2xl overflow-hidden ring-1 ring-white/10">
              <img src={githubAvatar} alt="Resonance" className="w-full h-full object-cover" />
            </div>
          )}
          {!sidebarCollapsed && (
            <div>
              <h1 className="text-xl font-semibold tracking-wide text-white">Resonance</h1>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mt-1">Music player</p>
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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-3xl transition-all duration-200 ${
                currentView === item.id
                  ? 'bg-white/10 text-white shadow-inner shadow-slate-950/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={22} />
              {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          );
        })}

        <div className="mt-8 space-y-2">
          <div className="px-4 pb-2">
            {!sidebarCollapsed && <h3 className="text-xs uppercase tracking-[0.3em] text-slate-500">Library</h3>}
          </div>
          <button
            onClick={() => setShowUploadDialog(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-3xl text-slate-200 hover:text-white bg-white/5 transition"
          >
            <Plus size={22} />
            {!sidebarCollapsed && <span className="text-sm font-medium">Add Music</span>}
          </button>
          <button
            onClick={() => setShowYouTubeSearch(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-3xl text-slate-200 hover:text-white bg-white/5 transition"
          >
            <Youtube size={22} />
            {!sidebarCollapsed && <span className="text-sm font-medium">YouTube</span>}
          </button>
        </div>
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900/90 rounded-2xl flex items-center justify-center ring-1 ring-white/10">
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
        className="absolute top-1/2 -right-4 z-10 w-9 h-9 bg-slate-900/95 border border-white/10 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-900 transition-all duration-200"
      >
        {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </div>
  );

  const HomeView = () => (
    <ScrollArea className="flex-1">
      <div className="p-6 md:p-8 space-y-8">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.4em] text-slate-500">Good evening</p>
          <h1 className="text-4xl md:text-5xl font-semibold text-white tracking-tight">Your music, your mood.</h1>
          <p className="max-w-2xl text-slate-400">Stream your library, continue listening, and manage playlists with a premium player feel across every view.</p>
        </div>

        {currentTrack && (
          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-950/95 via-slate-900 to-slate-800 p-6 shadow-2xl backdrop-blur-xl">
            <div className="grid gap-6 md:grid-cols-[280px_1fr] items-center">
              <div className="rounded-[2rem] overflow-hidden shadow-2xl ring-1 ring-white/10">
                <img src={currentTrack.artwork_url} alt={currentTrack.title} className="w-full h-full object-cover" />
              </div>

              <div className="space-y-5">
                <div>
                  <h2 className="text-lg uppercase tracking-[0.3em] text-slate-500">Now Playing</h2>
                  <h3 className="text-3xl font-semibold text-white mt-3">{currentTrack.title}</h3>
                  <p className="text-slate-400 mt-2">{currentTrack.artist}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button variant="secondary" className="rounded-full px-5 py-3">Play</Button>
                  <Button variant="outline" className="rounded-full px-5 py-3">Queue</Button>
                  <Button variant="ghost" className="rounded-full px-5 py-3">Share</Button>
                </div>

                <div className="rounded-3xl bg-slate-900/80 border border-white/10 p-4">
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
                <div key={idx} className="h-56 rounded-[2rem] bg-slate-900/80 border border-white/10 animate-pulse" />
              ))}
            </div>
          ) : recentTracks.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {recentTracks.slice(0, 10).map((track, idx) => (
                <div
                  key={idx}
                  onClick={() => handleTrackSelect(track)}
                  className="group cursor-pointer overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/90 shadow-[0_40px_80px_-50px_rgba(0,0,0,0.6)] transition hover:-translate-y-1"
                >
                  <div className="aspect-square overflow-hidden">
                    <img src={track.artwork_url} alt={track.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  </div>
                  <div className="p-4 space-y-1">
                    <h3 className="text-white font-semibold truncate">{track.title}</h3>
                    <p className="text-slate-400 text-sm truncate">{track.artist}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToQueue(track);
                        }}
                        className="rounded-full px-3 py-2"
                      >
                        Add to queue
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTrackSelect(track);
                        }}
                        className="rounded-full px-3 py-2"
                      >
                        Play now
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[2rem] border border-dashed border-white/10 bg-slate-950/50 p-12 text-center">
              <Music size={48} className="mx-auto mb-4 text-slate-500" />
              <h3 className="text-white text-xl font-semibold mb-2">No music yet</h3>
              <p className="text-slate-400 mb-6">Upload a track or search YouTube to start streaming.</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button onClick={() => setShowUploadDialog(true)} className="bg-indigo-500 text-white hover:bg-indigo-600 rounded-full px-5 py-3">Upload Music</Button>
                <Button onClick={() => setShowYouTubeSearch(true)} variant="outline" className="rounded-full px-5 py-3">YouTube Search</Button>
              </div>
            </div>
          )}
          {queue.length > 0 && (
            <div className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 mt-8">
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
                  <div key={track.id || idx} className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                    <div>
                      <p className="text-sm text-slate-400">{idx + 1}. {track.title}</p>
                      <p className="text-sm text-white truncate">{track.artist}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => playTrack(track, queue)}>
                        Play
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleRemoveFromQueue(idx)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );

  const SearchView = () => (
    <ScrollArea className="flex-1">
      <div className="p-6 md:p-8 space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold text-white">Search artists, songs, and playlists</h1>
          <div className="max-w-2xl">
            <div className="relative">
              <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="What do you want to listen to?"
                className="w-full rounded-[2rem] border border-white/10 bg-slate-900/90 py-4 pl-14 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">Browse Genres</h2>
              <p className="text-slate-500">Find playlists, moods, and trends curated for you.</p>
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
              <div key={idx} className={`overflow-hidden rounded-[2rem] bg-gradient-to-br ${genre.color} shadow-2xl shadow-slate-950/20 transition hover:-translate-y-1`}>
                <div className="p-5 h-28 flex items-end">
                  <h3 className="text-white font-semibold text-lg">{genre.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );

  const LibraryView = () => (
    <ScrollArea className="flex-1">
      <div className="p-6 md:p-8 space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold text-white">Your Library</h1>
            <p className="text-slate-500 mt-2">{recentTracks.length} songs available to play.</p>
          </div>
          <Button variant="outline" className="rounded-full px-5 py-3 text-slate-300 hover:text-white border-white/10">
            <Clock size={16} className="mr-2" />
            Recently added
          </Button>
        </div>

        {recentTracks.length > 0 ? (
          <div className="grid gap-4">
            {recentTracks.map((track, idx) => (
              <div
                key={idx}
                onClick={() => handleTrackSelect(track)}
                className="group flex flex-col gap-4 overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/90 p-4 transition hover:-translate-y-1 hover:bg-slate-900/90"
              >
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20 overflow-hidden rounded-3xl">
                    <img
                      src={track.artwork_url}
                      alt={track.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-white text-lg font-semibold truncate">{track.title}</h3>
                    <p className="text-slate-400 truncate">{track.artist}</p>
                    <p className="text-slate-500 text-sm mt-1">{track.album || 'Single'}</p>
                  </div>
                  <div className="text-slate-400 text-sm">{formatTime(track.duration || 0)}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-white/10 bg-slate-950/70 p-12 text-center">
            <Library size={48} className="mx-auto mb-4 text-slate-500" />
            <h3 className="text-white text-xl font-semibold mb-2">Your library is empty</h3>
            <p className="text-slate-400 mb-6">Upload tracks or add music from YouTube to build your collection.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={() => setShowUploadDialog(true)} className="bg-indigo-500 text-white hover:bg-indigo-600 rounded-full px-5 py-3">Upload Music</Button>
              <Button onClick={() => setShowYouTubeSearch(true)} variant="outline" className="rounded-full px-5 py-3">Search YouTube</Button>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );

  const FullPlayerView = () => (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white">
      <div className="relative h-full flex flex-col">
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10 backdrop-blur-xl bg-slate-950/90">
          <button
            onClick={() => setIsFullPlayer(false)}
            className="rounded-full border border-white/10 bg-slate-900/80 p-3 text-slate-100 hover:bg-white/10"
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
            <div className="w-[88vw] max-w-[420px] rounded-[3rem] overflow-hidden shadow-2xl shadow-slate-950/40 ring-1 ring-white/10">
              <img src={currentTrack.artwork_url} alt={currentTrack.title} className="w-full h-full object-cover" />
            </div>

            <div className="text-center space-y-4">
              <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Now playing</p>
              <h2 className="text-4xl font-semibold text-white">{currentTrack.title}</h2>
              <p className="text-slate-400 text-lg">{currentTrack.artist}</p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button className="rounded-full border border-white/10 bg-white/10 px-5 py-3 text-white hover:bg-white/20">Lyrics</button>
              <button className="rounded-full border border-white/10 bg-white/10 px-5 py-3 text-white hover:bg-white/20">Share</button>
              <button className="rounded-full border border-white/10 bg-white/10 px-5 py-3 text-white hover:bg-white/20">Spotify</button>
            </div>

            <div className="w-full max-w-xl rounded-[2rem] bg-slate-900/90 border border-white/10 p-5">
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
                className={`rounded-full border border-white/10 p-4 ${shuffle ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-900/80 text-slate-300 hover:bg-white/10'}`}
              >
                <Shuffle size={20} />
              </button>
              <button
                onClick={playPrevious}
                className="rounded-full border border-white/10 bg-slate-900/80 p-4 text-slate-300 hover:bg-white/10"
              >
                <SkipBack size={24} />
              </button>
              <button
                onClick={togglePlayPause}
                className="rounded-full bg-white p-5 shadow-xl shadow-slate-950/30 text-slate-950 hover:scale-[1.02] transition"
              >
                {isPlaying ? <Pause size={28} /> : <Play size={28} />}
              </button>
              <button
                onClick={playNext}
                className="rounded-full border border-white/10 bg-slate-900/80 p-4 text-slate-300 hover:bg-white/10"
              >
                <SkipForward size={24} />
              </button>
              <button
                onClick={toggleRepeat}
                className={`rounded-full border border-white/10 p-4 ${repeat !== 'none' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-900/80 text-slate-300 hover:bg-white/10'}`}
              >
                <Repeat size={20} />
              </button>
            </div>

            <div className="w-full max-w-xl rounded-[2rem] bg-slate-900/90 border border-white/10 p-4 flex items-center gap-3">
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
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-slate-950/95 backdrop-blur-xl p-4 shadow-2xl shadow-slate-950/40">
      <div className="mx-auto flex max-w-6xl items-center gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setIsFullPlayer(true)}
            className="h-16 w-16 rounded-3xl overflow-hidden ring-1 ring-white/10"
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
              className={`rounded-full p-3 ${shuffle ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-900/80 text-slate-300 hover:bg-white/10'}`}
            >
              <Shuffle size={16} />
            </button>
            <button onClick={playPrevious} className="rounded-full bg-slate-900/80 p-3 text-slate-300 hover:bg-white/10">
              <SkipBack size={16} />
            </button>
            <button onClick={togglePlayPause} className="rounded-full bg-white p-3 text-slate-950 shadow-lg shadow-slate-950/20">
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button onClick={playNext} className="rounded-full bg-slate-900/80 p-3 text-slate-300 hover:bg-white/10">
              <SkipForward size={16} />
            </button>
            <button
              onClick={toggleRepeat}
              className={`rounded-full p-3 ${repeat !== 'none' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-900/80 text-slate-300 hover:bg-white/10'}`}
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
    <div className="h-screen bg-black text-white flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-gradient-to-b from-gray-900 to-black p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="text-gray-400 hover:text-white"
              >
                <Menu size={20} />
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.history.back()}
                  className="text-gray-400 hover:text-white rounded-full w-8 h-8 p-0"
                >
                  <ArrowLeft size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.history.forward()}
                  className="text-gray-400 hover:text-white rounded-full w-8 h-8 p-0"
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" className="text-gray-400 hover:text-white">
                Upgrade
              </Button>
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                <User size={16} className="text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {currentView === 'home' && <HomeView />}
        {currentView === 'search' && <SearchView />}
        {currentView === 'library' && <LibraryView />}

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

      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
};

export default ResonanceApp;