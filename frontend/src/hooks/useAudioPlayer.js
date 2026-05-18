import { useState, useRef, useEffect, useCallback } from 'react';
import { getOfflineTracks } from '../lib/offlineStorage';

export const useAudioPlayer = (trackAPI, youtubeAPI) => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(75);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState('none'); // 'none', 'track', 'playlist'
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const audioRef = useRef(null);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'metadata';
    }

    const audio = audioRef.current;

    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => handleTrackEnd();
    const handleError = () => {
      setError('Failed to load audio. Make sure the file exists and is a supported format (MP3, WAV, OGG, FLAC).');
      setIsLoading(false);
      setIsPlaying(false);
    };
    const handleCanPlay = () => setIsLoading(false);
    const handleLoadStart = () => setIsLoading(true);

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadstart', handleLoadStart);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadstart', handleLoadStart);
    };
  }, []);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.min(Math.max(volume / 100, 0), 1);
    }
  }, [volume]);

  const getTrackKey = useCallback((track) => {
    if (!track) return null;
    return track.id || track._id || track.file_url || track.title;
  }, []);

  // ✅ ENHANCED: Returns a Promise that resolves when audio is ready to play
  // Now handles YouTube, local server streams, and offline tracks
  const loadTrack = useCallback(async (track) => {
    if (!audioRef.current) throw new Error('Audio not initialized');

    setError(null);
    setIsLoading(true);

    let audioUrl = track.file_url;

    // 1. Check if track is already an offline blob
    if (track.source === 'offline' && track.audio_blob) {
      audioUrl = URL.createObjectURL(track.audio_blob);
    }

    // 2. If offline, check IndexedDB even if track wasn't explicitly from 'offline' source
    if (!audioUrl && !isOnline) {
      try {
        const offlineTracks = await getOfflineTracks();
        const trackKey = getTrackKey(track);
        const offlineTrack = offlineTracks.find(t => getTrackKey(t) === trackKey);
        if (offlineTrack && offlineTrack.audio_blob) {
          audioUrl = URL.createObjectURL(offlineTrack.audio_blob);
        }
      } catch (err) {
        console.error('Failed to find offline track:', err);
      }
    }

    // 3. If still no URL and online, try to get from backend
    if (!audioUrl && isOnline) {
      try {
        if (track.source === 'youtube' && track.youtube_id && youtubeAPI) {
          audioUrl = await youtubeAPI.getStreamUrl(track.youtube_id);
        } else if ((track.id || track._id) && trackAPI) {
          audioUrl = trackAPI.getStreamUrl(track.id || track._id);
        }
      } catch (err) {
        console.error('Failed to get stream URL:', err);
      }
    }

    if (!audioUrl) {
      const err = new Error(isOnline ? 'No audio source available for this track.' : 'Internet connection required for this track.');
      setError(err.message);
      setIsLoading(false);
      throw err;
    }

    return new Promise((resolve, reject) => {
      // ✅ Wait for canplay before resolving so play() doesn't fire too early
      const onCanPlay = () => {
        cleanup();
        resolve();
      };

      const onError = () => {
        cleanup();
        setError('Failed to load audio file. Check the file path or format.');
        setIsLoading(false);
        reject(new Error('Audio load error'));
      };

      const cleanup = () => {
        audioRef.current.removeEventListener('canplay', onCanPlay);
        audioRef.current.removeEventListener('error', onError);
      };

      audioRef.current.addEventListener('canplay', onCanPlay);
      audioRef.current.addEventListener('error', onError);

      audioRef.current.src = audioUrl;
      setCurrentTrack(track);
      audioRef.current.load();
    });
  }, [trackAPI, youtubeAPI, isOnline, getTrackKey]);

  const play = useCallback(async () => {
    if (!audioRef.current || !currentTrack) return;
    try {
      await audioRef.current.play();
      setIsPlaying(true);
      setError(null);
    } catch (err) {
      console.error('Playback error:', err);
      setError('Failed to play. Try clicking play again.');
      setIsPlaying(false);
    }
  }, [currentTrack]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const seek = useCallback((time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const playTrackFromQueue = useCallback(async (index) => {
    if (index >= 0 && index < queue.length) {
      setCurrentIndex(index);
      try {
        await loadTrack(queue[index]);
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        console.error('Error playing from queue:', err);
      }
    }
  }, [queue, loadTrack]);

  // ✅ FIXED: Added missing dependencies
  const handleTrackEnd = useCallback(() => {
    if (repeat === 'track') {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else if (repeat === 'playlist' && queue.length > 0) {
      const nextIndex = currentIndex + 1 >= queue.length ? 0 : currentIndex + 1;
      playTrackFromQueue(nextIndex);
    } else if (currentIndex + 1 < queue.length) {
      playTrackFromQueue(currentIndex + 1);
    } else {
      setIsPlaying(false);
    }
  }, [repeat, queue, currentIndex, playTrackFromQueue]);

  // ✅ FIXED: Waits for audio to be ready before playing
  const playTrack = useCallback(async (track, trackQueue = []) => {
    try {
      if (trackQueue.length > 0) {
        setQueue(trackQueue);
        const trackKey = getTrackKey(track);
        const index = trackQueue.findIndex((t) => getTrackKey(t) === trackKey);
        setCurrentIndex(index >= 0 ? index : 0);
      }

      await loadTrack(track);           // ✅ waits until audio is truly ready
      await audioRef.current.play();    // ✅ then plays safely
      setIsPlaying(true);
    } catch (err) {
      console.error('Error in playTrack:', err);
    }
  }, [getTrackKey, loadTrack]);

  const playNext = useCallback(() => {
    if (queue.length > 0) {
      const nextIndex = shuffle
        ? Math.floor(Math.random() * queue.length)
        : currentIndex + 1 < queue.length ? currentIndex + 1 : 0;
      playTrackFromQueue(nextIndex);
    }
  }, [queue, currentIndex, shuffle, playTrackFromQueue]);

  const playPrevious = useCallback(() => {
    if (queue.length > 0) {
      const prevIndex = shuffle
        ? Math.floor(Math.random() * queue.length)
        : currentIndex - 1 >= 0 ? currentIndex - 1 : queue.length - 1;
      playTrackFromQueue(prevIndex);
    }
  }, [queue, currentIndex, shuffle, playTrackFromQueue]);

  // Media Session API (lock screen / OS media controls)
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    if (currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title || 'Unknown Title',
        artist: currentTrack.artist || 'Unknown Artist',
        album: currentTrack.album || 'Resonance',
        artwork: currentTrack.artwork_url
          ? [{ src: currentTrack.artwork_url, sizes: '512x512', type: 'image/png' }]
          : [],
      });
    }

    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    navigator.mediaSession.setActionHandler('play', play);
    navigator.mediaSession.setActionHandler('pause', pause);
    navigator.mediaSession.setActionHandler('previoustrack', playPrevious);
    navigator.mediaSession.setActionHandler('nexttrack', playNext);
    navigator.mediaSession.setActionHandler('stop', pause);
  }, [currentTrack, isPlaying, play, pause, playNext, playPrevious]);

  const addToQueue = useCallback((tracks) => {
    setQueue(prev => [...prev, ...tracks]);
  }, []);

  const removeFromQueue = useCallback((index) => {
    setQueue(prev => {
      const newQueue = [...prev];
      newQueue.splice(index, 1);
      if (index < currentIndex) {
        setCurrentIndex(i => i - 1);
      } else if (index === currentIndex && newQueue.length > 0) {
        loadTrack(newQueue[Math.min(currentIndex, newQueue.length - 1)]);
      }
      return newQueue;
    });
  }, [currentIndex, loadTrack]);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setCurrentIndex(0);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.matches('input, textarea')) return;
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowRight':
        case 'KeyN':
          if (e.ctrlKey || e.metaKey) return;
          playNext();
          break;
        case 'ArrowLeft':
        case 'KeyP':
          if (e.ctrlKey || e.metaKey) return;
          playPrevious();
          break;
        case 'KeyS':
          if (e.ctrlKey || e.metaKey) return;
          e.preventDefault();
          setShuffle(prev => !prev);
          break;
        case 'KeyR':
          if (e.ctrlKey || e.metaKey) return;
          e.preventDefault();
          setRepeat(prev =>
            prev === 'none' ? 'playlist' : prev === 'playlist' ? 'track' : 'none'
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(prev => Math.min(prev + 5, 100));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(prev => Math.max(prev - 5, 0));
          break;
        case 'KeyM':
          if (e.ctrlKey || e.metaKey) return;
          e.preventDefault();
          setVolume(prev => (prev > 0 ? 0 : 75));
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause, playNext, playPrevious]);

  const formatTime = useCallback((seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isLoading,
    error,
    queue,
    currentIndex,
    shuffle,
    repeat,
    playTrack,
    togglePlayPause,
    play,
    pause,
    seek,
    playNext,
    playPrevious,
    setVolume,
    setShuffle,
    setRepeat,
    addToQueue,
    removeFromQueue,
    clearQueue,
    playTrackFromQueue,
    formatTime,
    isOnline,
  };
};
