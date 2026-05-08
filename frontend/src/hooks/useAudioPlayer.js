import { useState, useRef, useEffect, useCallback } from 'react';
import { trackAPI, youtubeAPI } from '../services/api';

export const useAudioPlayer = () => {
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
  
  const audioRef = useRef(null);
  const intervalRef = useRef(null);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'metadata';
    }

    const audio = audioRef.current;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      handleTrackEnd();
    };

    const handleError = (e) => {
      setError('Failed to load audio');
      setIsLoading(false);
      setIsPlaying(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

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

  // Update audio volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.min(Math.max(volume / 100, 0), 1);
    }
  }, [volume]);

  const getTrackKey = useCallback((track) => {
    if (!track) return null;
    return track.id || track.file_url || track.title;
  }, []);

  const loadTrack = useCallback(async (track) => {
    if (!audioRef.current) return;

    setError(null);
    setIsLoading(true);
    
    try {
      let audioUrl;
      
      if (track.source === 'local') {
        audioUrl = trackAPI.getStreamUrl(track.id);
      } else if (track.source === 'youtube') {
        audioUrl = await youtubeAPI.getStreamUrl(track.youtube_id);
      } else if (track.source === 'browser' && track.file_url) {
        audioUrl = track.file_url;
      } else if (track.file_url) {
        audioUrl = track.file_url;
      }

      if (audioUrl) {
        audioRef.current.src = audioUrl;
        setCurrentTrack(track);
        
        // Load the audio and allow event handlers to update duration/state
        audioRef.current.load();
      } else {
        throw new Error('No audio URL available');
      }
    } catch (error) {
      console.error('Error loading track:', error);
      setError('Failed to load track');
      setIsLoading(false);
    }
  }, []);

  const play = useCallback(async () => {
    if (!audioRef.current || !currentTrack) return;

    try {
      await audioRef.current.play();
      setIsPlaying(true);
      setError(null);
    } catch (error) {
      console.error('Error playing audio:', error);
      setError('Failed to play audio');
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

  const handleTrackEnd = useCallback(() => {
    if (repeat === 'track') {
      // Repeat current track
      audioRef.current.currentTime = 0;
      play();
    } else if (repeat === 'playlist' && queue.length > 0) {
      // Move to next track or loop to beginning
      const nextIndex = currentIndex + 1 >= queue.length ? 0 : currentIndex + 1;
      playTrackFromQueue(nextIndex);
    } else if (currentIndex + 1 < queue.length) {
      // Play next track
      playTrackFromQueue(currentIndex + 1);
    } else {
      // End of queue
      setIsPlaying(false);
    }
  }, [repeat, queue, currentIndex]);

  const playTrack = useCallback(async (track, trackQueue = []) => {
    await loadTrack(track);
    
    if (trackQueue.length > 0) {
      setQueue(trackQueue);
      const trackKey = getTrackKey(track);
      const index = trackQueue.findIndex((t) => getTrackKey(t) === trackKey);
      setCurrentIndex(index >= 0 ? index : 0);
    }
    
    await play();
  }, [getTrackKey, loadTrack, play]);

  const playTrackFromQueue = useCallback(async (index) => {
    if (index >= 0 && index < queue.length) {
      setCurrentIndex(index);
      await playTrack(queue[index]);
    }
  }, [queue, playTrack]);

  const playNext = useCallback(() => {
    if (queue.length > 0) {
      let nextIndex;
      if (shuffle) {
        nextIndex = Math.floor(Math.random() * queue.length);
      } else {
        nextIndex = currentIndex + 1 < queue.length ? currentIndex + 1 : 0;
      }
      playTrackFromQueue(nextIndex);
    }
  }, [queue, currentIndex, shuffle, playTrackFromQueue]);

  const playPrevious = useCallback(() => {
    if (queue.length > 0) {
      let prevIndex;
      if (shuffle) {
        prevIndex = Math.floor(Math.random() * queue.length);
      } else {
        prevIndex = currentIndex - 1 >= 0 ? currentIndex - 1 : queue.length - 1;
      }
      playTrackFromQueue(prevIndex);
    }
  }, [queue, currentIndex, shuffle, playTrackFromQueue]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    if (currentTrack && typeof MediaMetadata !== 'undefined') {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album || 'Resonance',
        artwork: [
          { src: currentTrack.artwork_url, sizes: '512x512', type: 'image/png' },
        ],
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
    setQueue(prevQueue => [...prevQueue, ...tracks]);
  }, []);

  const removeFromQueue = useCallback((index) => {
    setQueue(prevQueue => {
      const newQueue = [...prevQueue];
      newQueue.splice(index, 1);
      
      // Adjust current index if necessary
      if (index < currentIndex) {
        setCurrentIndex(prev => prev - 1);
      } else if (index === currentIndex && newQueue.length > 0) {
        // If we removed the current track, play the next one
        const nextTrack = newQueue[Math.min(currentIndex, newQueue.length - 1)];
        if (nextTrack) {
          loadTrack(nextTrack);
        }
      }
      
      return newQueue;
    });
  }, [currentIndex, loadTrack]);

  const moveQueueItem = useCallback((index, direction) => {
    setQueue((prevQueue) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prevQueue.length) return prevQueue;

      const newQueue = [...prevQueue];
      const [moved] = newQueue.splice(index, 1);
      newQueue.splice(nextIndex, 0, moved);

      setCurrentIndex((current) => {
        if (current === index) return nextIndex;
        if (index < current && nextIndex >= current) return current - 1;
        if (index > current && nextIndex <= current) return current + 1;
        return current;
      });

      return newQueue;
    });
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setCurrentIndex(0);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts when typing in input fields
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
          setRepeat(prev => {
            if (prev === 'none') return 'playlist';
            if (prev === 'playlist') return 'track';
            return 'none';
          });
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
  }, [togglePlayPause, playNext, playPrevious, setShuffle, setRepeat, setVolume]);

  // Format time helpers
  const formatTime = useCallback((seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    // State
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
    
    // Actions
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
    
    // Queue management
    addToQueue,
    removeFromQueue,
    clearQueue,
    playTrackFromQueue,
    
    // Helpers
    formatTime
  };
};