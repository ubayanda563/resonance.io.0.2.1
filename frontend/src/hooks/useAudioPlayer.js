import { useState, useRef, useEffect, useCallback } from 'react';
import { getOfflineTracks } from '../lib/offlineStorage';

const EQ_BANDS = [
  { freq: 60,    type: 'lowshelf',  label: '60Hz'  },
  { freq: 250,   type: 'peaking',   label: '250Hz' },
  { freq: 1000,  type: 'peaking',   label: '1kHz'  },
  { freq: 4000,  type: 'peaking',   label: '4kHz'  },
  { freq: 14000, type: 'highshelf', label: '14kHz' },
];

export const useAudioPlayer = (trackAPI, youtubeAPI) => {
  const [currentTrack, setCurrentTrack]     = useState(null);
  const [isPlaying, setIsPlaying]           = useState(false);
  const [currentTime, setCurrentTime]       = useState(0);
  const [duration, setDuration]             = useState(0);
  const [volume, setVolumeState]            = useState(75);
  const [isLoading, setIsLoading]           = useState(false);
  const [error, setError]                   = useState(null);
  const [queue, setQueue]                   = useState([]);
  const [currentIndex, setCurrentIndex]     = useState(0);
  const [shuffle, setShuffle]               = useState(false);
  const [repeat, setRepeat]                 = useState('none');
  const [isOnline, setIsOnline]             = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [eqBands, setEqBandsState]          = useState([0, 0, 0, 0, 0]);
  const [crossfadeDuration, setCrossfadeDuration] = useState(2);
  const [sleepTimer, setSleepTimer]         = useState(null); // { remaining, total }

  const audioRef         = useRef(null);
  const audioCtxRef      = useRef(null);
  const gainNodeRef      = useRef(null);
  const eqNodesRef       = useRef([]);
  const sleepTimerRef    = useRef(null);
  const sleepIntervalRef = useRef(null);
  const crossfadeRef     = useRef(null);

  // ── Online / offline ────────────────────────────────────────────────────────
  useEffect(() => {
    const on  = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    const offlineDetected = () => setIsOnline(false);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    window.addEventListener('resonance-offline-detected', offlineDetected);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
      window.removeEventListener('resonance-offline-detected', offlineDetected);
    };
  }, []);

  // ── Create audio element ────────────────────────────────────────────────────
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'metadata';
    }
    const audio = audioRef.current;
    const onMeta    = () => setDuration(audio.duration);
    const onTime    = () => setCurrentTime(audio.currentTime);
    const onEnded   = () => handleTrackEnd();
    const onErr     = () => { setError('Failed to load audio.'); setIsLoading(false); setIsPlaying(false); };
    const onCan     = () => setIsLoading(false);
    const onStart   = () => setIsLoading(true);

    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('timeupdate',     onTime);
    audio.addEventListener('ended',          onEnded);
    audio.addEventListener('error',          onErr);
    audio.addEventListener('canplay',        onCan);
    audio.addEventListener('loadstart',      onStart);
    return () => {
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('timeupdate',     onTime);
      audio.removeEventListener('ended',          onEnded);
      audio.removeEventListener('error',          onErr);
      audio.removeEventListener('canplay',        onCan);
      audio.removeEventListener('loadstart',      onStart);
    };
  }, []);

  // ── Init Web Audio context + EQ graph ───────────────────────────────────────
  const initAudioContext = useCallback(() => {
    if (audioCtxRef.current) return;
    try {
      const ctx  = new (window.AudioContext || window.webkitAudioContext)();
      const src  = ctx.createMediaElementSource(audioRef.current);
      const gain = ctx.createGain();
      gain.gain.value = volume / 100;

      const filters = EQ_BANDS.map(({ freq, type }) => {
        const f = ctx.createBiquadFilter();
        f.type           = type;
        f.frequency.value = freq;
        f.gain.value     = 0;
        f.Q.value        = 1;
        return f;
      });

      // Chain: src → eq[0] → … → eq[4] → gain → destination
      src.connect(filters[0]);
      filters.forEach((f, i) => { if (i < filters.length - 1) f.connect(filters[i + 1]); });
      filters[filters.length - 1].connect(gain);
      gain.connect(ctx.destination);

      audioCtxRef.current = ctx;
      gainNodeRef.current = gain;
      eqNodesRef.current  = filters;
    } catch (e) {
      console.warn('Web Audio API not available:', e);
    }
  }, [volume]);

  // ── Volume ───────────────────────────────────────────────────────────────────
  const setVolume = useCallback((v) => {
    setVolumeState(v);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = v / 100;
    } else if (audioRef.current) {
      audioRef.current.volume = Math.min(Math.max(v / 100, 0), 1);
    }
  }, []);

  useEffect(() => {
    if (!gainNodeRef.current && audioRef.current) {
      audioRef.current.volume = Math.min(Math.max(volume / 100, 0), 1);
    }
  }, [volume]);

  // ── EQ ───────────────────────────────────────────────────────────────────────
  const setEqBand = useCallback((index, gainDb) => {
    if (eqNodesRef.current[index]) {
      eqNodesRef.current[index].gain.value = gainDb;
    }
    setEqBandsState(prev => { const n = [...prev]; n[index] = gainDb; return n; });
  }, []);

  const resetEq = useCallback(() => {
    eqNodesRef.current.forEach(f => { f.gain.value = 0; });
    setEqBandsState([0, 0, 0, 0, 0]);
  }, []);

  // ── Sleep timer ───────────────────────────────────────────────────────────────
  const startSleepTimer = useCallback((minutes) => {
    if (sleepTimerRef.current)    clearTimeout(sleepTimerRef.current);
    if (sleepIntervalRef.current) clearInterval(sleepIntervalRef.current);

    const total = minutes * 60;
    setSleepTimer({ remaining: total, total });

    sleepIntervalRef.current = setInterval(() => {
      setSleepTimer(prev => {
        if (!prev) return null;
        const next = prev.remaining - 1;
        if (next <= 0) {
          clearInterval(sleepIntervalRef.current);
          return null;
        }
        return { ...prev, remaining: next };
      });
    }, 1000);

    sleepTimerRef.current = setTimeout(() => {
      if (audioRef.current) { audioRef.current.pause(); setIsPlaying(false); }
      setSleepTimer(null);
      clearInterval(sleepIntervalRef.current);
    }, minutes * 60 * 1000);
  }, []);

  const cancelSleepTimer = useCallback(() => {
    if (sleepTimerRef.current)    clearTimeout(sleepTimerRef.current);
    if (sleepIntervalRef.current) clearInterval(sleepIntervalRef.current);
    setSleepTimer(null);
  }, []);

  // ── Track loading ─────────────────────────────────────────────────────────────
  const getTrackKey = useCallback((track) => {
    if (!track) return null;
    return track.id || track._id || track.file_url || track.title;
  }, []);

  const loadTrackInternal = useCallback(async (track) => {
    if (!audioRef.current) throw new Error('Audio not initialized');
    setError(null);
    setIsLoading(true);

    let audioUrl = track.file_url;

    if (track.source === 'offline' && track.audio_blob) {
      audioUrl = URL.createObjectURL(track.audio_blob);
    }
    if (!audioUrl && !isOnline) {
      try {
        const offline = await getOfflineTracks();
        const key     = getTrackKey(track);
        const found   = offline.find(t => getTrackKey(t) === key);
        if (found?.audio_blob) audioUrl = URL.createObjectURL(found.audio_blob);
      } catch { /* noop */ }
    }
    if (!audioUrl && isOnline) {
      try {
        if (track.source === 'youtube' && track.youtube_id && youtubeAPI) {
          audioUrl = await youtubeAPI.getStreamUrl(track.youtube_id);
        } else if ((track.id || track._id) && trackAPI) {
          audioUrl = trackAPI.getStreamUrl(track.id || track._id);
        }
      } catch (e) { console.error('Stream URL error:', e); }
    }

    if (!audioUrl) {
      const msg = isOnline ? 'No audio source available.' : 'Internet required for this track.';
      setError(msg);
      setIsLoading(false);
      throw new Error(msg);
    }

    return new Promise((resolve, reject) => {
      const onCan = () => { cleanup(); resolve(); };
      const onErr = () => { cleanup(); setError('Failed to load audio.'); setIsLoading(false); reject(new Error('load error')); };
      const cleanup = () => {
        audioRef.current.removeEventListener('canplay', onCan);
        audioRef.current.removeEventListener('error',   onErr);
      };
      audioRef.current.addEventListener('canplay', onCan);
      audioRef.current.addEventListener('error',   onErr);
      audioRef.current.src = audioUrl;
      setCurrentTrack(track);
      audioRef.current.load();
    });
  }, [trackAPI, youtubeAPI, isOnline, getTrackKey]);

  // ── Crossfade ─────────────────────────────────────────────────────────────────
  const crossfadeTo = useCallback(async (track) => {
    // Cancel any ongoing crossfade
    if (crossfadeRef.current) clearTimeout(crossfadeRef.current);

    const duration = crossfadeDuration;
    const ctx  = audioCtxRef.current;
    const gain = gainNodeRef.current;

    if (!ctx || !gain || duration === 0 || !isPlaying) {
      return loadTrackInternal(track);
    }

    try {
      const now = ctx.currentTime;
      // Fade out current
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + duration);

      await new Promise(r => { crossfadeRef.current = setTimeout(r, duration * 1000); });

      await loadTrackInternal(track);

      // Fade in
      const n2 = ctx.currentTime;
      gain.gain.cancelScheduledValues(n2);
      gain.gain.setValueAtTime(0, n2);
      gain.gain.linearRampToValueAtTime(volume / 100, n2 + duration);
    } catch {
      return loadTrackInternal(track);
    }
  }, [crossfadeDuration, isPlaying, loadTrackInternal, volume]);

  // ── Playback ──────────────────────────────────────────────────────────────────
  const play = useCallback(async () => {
    if (!audioRef.current || !currentTrack) return;
    try {
      if (audioCtxRef.current?.state === 'suspended') await audioCtxRef.current.resume();
      await audioRef.current.play();
      setIsPlaying(true);
      setError(null);
    } catch (e) {
      setError('Failed to play. Try clicking play again.');
      setIsPlaying(false);
    }
  }, [currentTrack]);

  const pause = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); setIsPlaying(false); }
  }, []);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) pause(); else play();
  }, [isPlaying, play, pause]);

  const seek = useCallback((time) => {
    if (audioRef.current) { audioRef.current.currentTime = time; setCurrentTime(time); }
  }, []);

  const playTrackFromQueue = useCallback(async (index) => {
    if (index < 0 || index >= queue.length) return;
    setCurrentIndex(index);
    try {
      initAudioContext();
      await crossfadeTo(queue[index]);
      if (audioCtxRef.current?.state === 'suspended') await audioCtxRef.current.resume();
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (e) { console.error('Queue play error:', e); }
  }, [queue, initAudioContext, crossfadeTo]);

  const handleTrackEnd = useCallback(() => {
    if (repeat === 'track') {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else if (repeat === 'playlist' && queue.length > 0) {
      const next = currentIndex + 1 >= queue.length ? 0 : currentIndex + 1;
      playTrackFromQueue(next);
    } else if (currentIndex + 1 < queue.length) {
      playTrackFromQueue(currentIndex + 1);
    } else {
      setIsPlaying(false);
    }
  }, [repeat, queue, currentIndex, playTrackFromQueue]);

  const playTrack = useCallback(async (track, trackQueue = []) => {
    try {
      initAudioContext();
      if (trackQueue.length > 0) {
        setQueue(trackQueue);
        const key   = getTrackKey(track);
        const index = trackQueue.findIndex(t => getTrackKey(t) === key);
        setCurrentIndex(index >= 0 ? index : 0);
      }
      await crossfadeTo(track);
      if (audioCtxRef.current?.state === 'suspended') await audioCtxRef.current.resume();
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (e) { console.error('playTrack error:', e); }
  }, [getTrackKey, initAudioContext, crossfadeTo]);

  const playNext = useCallback(() => {
    if (!queue.length) return;
    const next = shuffle
      ? Math.floor(Math.random() * queue.length)
      : currentIndex + 1 < queue.length ? currentIndex + 1 : 0;
    playTrackFromQueue(next);
  }, [queue, currentIndex, shuffle, playTrackFromQueue]);

  const playPrevious = useCallback(() => {
    if (!queue.length) return;
    const prev = shuffle
      ? Math.floor(Math.random() * queue.length)
      : currentIndex - 1 >= 0 ? currentIndex - 1 : queue.length - 1;
    playTrackFromQueue(prev);
  }, [queue, currentIndex, shuffle, playTrackFromQueue]);

  // ── Queue management ──────────────────────────────────────────────────────────
  const addToQueue = useCallback((tracks) => {
    setQueue(prev => [...prev, ...(Array.isArray(tracks) ? tracks : [tracks])]);
  }, []);

  const removeFromQueue = useCallback((index) => {
    setQueue(prev => {
      const next = [...prev];
      next.splice(index, 1);
      if (index < currentIndex) setCurrentIndex(i => i - 1);
      else if (index === currentIndex && next.length > 0) loadTrackInternal(next[Math.min(currentIndex, next.length - 1)]);
      return next;
    });
  }, [currentIndex, loadTrackInternal]);

  const reorderQueue = useCallback((fromIndex, toIndex) => {
    setQueue(prev => {
      const next  = [...prev];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      if (fromIndex === currentIndex) setCurrentIndex(toIndex);
      else if (fromIndex < currentIndex && toIndex >= currentIndex) setCurrentIndex(i => i - 1);
      else if (fromIndex > currentIndex && toIndex <= currentIndex) setCurrentIndex(i => i + 1);
      return next;
    });
  }, [currentIndex]);

  const clearQueue = useCallback(() => { setQueue([]); setCurrentIndex(0); }, []);

  // ── Media Session ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
    if (currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title:   currentTrack.title  || 'Unknown',
        artist:  currentTrack.artist || 'Unknown',
        album:   currentTrack.album  || 'Resonance',
        artwork: currentTrack.artwork_url ? [{ src: currentTrack.artwork_url, sizes: '512x512', type: 'image/png' }] : [],
      });
    }
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    navigator.mediaSession.setActionHandler('play',          play);
    navigator.mediaSession.setActionHandler('pause',         pause);
    navigator.mediaSession.setActionHandler('previoustrack', playPrevious);
    navigator.mediaSession.setActionHandler('nexttrack',     playNext);
    navigator.mediaSession.setActionHandler('stop',          pause);
  }, [currentTrack, isPlaying, play, pause, playNext, playPrevious]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.target.matches('input, textarea')) return;
      switch (e.code) {
        case 'Space':      e.preventDefault(); togglePlayPause(); break;
        case 'ArrowRight':
        case 'KeyN':       if (!e.ctrlKey && !e.metaKey) playNext(); break;
        case 'ArrowLeft':
        case 'KeyP':       if (!e.ctrlKey && !e.metaKey) playPrevious(); break;
        case 'KeyS':       if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); setShuffle(p => !p); } break;
        case 'KeyR':       if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); setRepeat(p => p === 'none' ? 'playlist' : p === 'playlist' ? 'track' : 'none'); } break;
        case 'ArrowUp':    e.preventDefault(); setVolume(Math.min(volume + 5, 100)); break;
        case 'ArrowDown':  e.preventDefault(); setVolume(Math.max(volume - 5, 0)); break;
        case 'KeyM':       if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); setVolume(volume > 0 ? 0 : 75); } break;
        default: break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [togglePlayPause, playNext, playPrevious, volume, setVolume]);

  const formatTime = useCallback((seconds) => {
    if (isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, []);

  return {
    currentTrack, isPlaying, currentTime, duration,
    volume, isLoading, error,
    queue, currentIndex, shuffle, repeat,
    eqBands, EQ_BANDS, crossfadeDuration, sleepTimer,
    playTrack, togglePlayPause, play, pause,
    seek, playNext, playPrevious,
    setVolume, setShuffle, setRepeat,
    addToQueue, removeFromQueue, reorderQueue, clearQueue, playTrackFromQueue,
    setEqBand, resetEq,
    setCrossfadeDuration,
    startSleepTimer, cancelSleepTimer,
    formatTime, isOnline, initAudioContext,
  };
};
