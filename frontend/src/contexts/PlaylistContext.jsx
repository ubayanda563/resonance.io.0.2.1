import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { playlistAPI } from '../services/api';

const PlaylistContext = createContext();

export const usePlaylistContext = () => {
  const context = useContext(PlaylistContext);
  if (!context) {
    throw new Error('usePlaylistContext must be used within PlaylistProvider');
  }
  return context;
};

export const PlaylistProvider = ({ children }) => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load playlists on mount
  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await playlistAPI.getPlaylists();
      setPlaylists(data);
    } catch (err) {
      setError(err.message);
      console.error('Error loading playlists:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createPlaylist = useCallback(async (name, tracks = []) => {
    try {
      const newPlaylist = await playlistAPI.createPlaylist(name, tracks);
      setPlaylists([...playlists, newPlaylist]);
      return newPlaylist;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [playlists]);

  const deletePlaylist = useCallback(async (playlistId) => {
    try {
      await playlistAPI.deletePlaylist(playlistId);
      setPlaylists(playlists.filter(p => p.id !== playlistId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [playlists]);

  const updatePlaylist = useCallback(async (playlistId, updates) => {
    try {
      await playlistAPI.updatePlaylist(playlistId, updates);
      setPlaylists(playlists.map(p => 
        p.id === playlistId ? { ...p, ...updates } : p
      ));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [playlists]);

  const addTrackToPlaylist = useCallback(async (playlistId, trackId) => {
    try {
      await playlistAPI.addTrackToPlaylist(playlistId, trackId);
      await loadPlaylists(); // Reload to get updated track count
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [loadPlaylists]);

  const removeTrackFromPlaylist = useCallback(async (playlistId, trackId) => {
    try {
      await playlistAPI.removeTrackFromPlaylist(playlistId, trackId);
      await loadPlaylists(); // Reload to get updated track count
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [loadPlaylists]);

  const value = {
    playlists,
    loading,
    error,
    loadPlaylists,
    createPlaylist,
    deletePlaylist,
    updatePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
  };

  return (
    <PlaylistContext.Provider value={value}>
      {children}
    </PlaylistContext.Provider>
  );
};
