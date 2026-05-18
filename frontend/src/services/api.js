import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

console.log('BACKEND_URL:', BACKEND_URL);
console.log('API URL:', API);

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API,
  timeout: 30000, // 30 seconds for file uploads
});

// Track API
export const trackAPI = {
  // Get all tracks
  getTracks: async (params = {}) => {
    const response = await apiClient.get('/tracks', { params });
    return response.data;
  },

  // Get recent tracks
  getRecentTracks: async (limit = 20) => {
    const response = await apiClient.get('/tracks/recent', { params: { limit } });
    return response.data;
  },

  // Get track by ID
  getTrack: async (trackId) => {
    const response = await apiClient.get(`/tracks/${trackId}`);
    return response.data;
  },

  // Upload track
  uploadTrack: async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/tracks/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      },
    });
    return response.data;
  },

  // Update track
  updateTrack: async (trackId, updateData) => {
    const response = await apiClient.put(`/tracks/${trackId}`, updateData);
    return response.data;
  },

  // Delete track
  deleteTrack: async (trackId) => {
    const response = await apiClient.delete(`/tracks/${trackId}`);
    return response.data;
  },

  // Get stream URL for local track
  getStreamUrl: (trackId) => {
    return `${API}/tracks/${trackId}/stream`;
  },

  // Get library stats
  getLibraryStats: async () => {
    const response = await apiClient.get('/tracks/stats');
    return response.data;
  },
};

// YouTube API
export const youtubeAPI = {
  // Search YouTube
  search: async (query, limit = 10) => {
    const response = await apiClient.get('/youtube/search', {
      params: { q: query, limit },
    });
    return response.data;
  },

  // Get track info
  getTrackInfo: async (youtubeId) => {
    const response = await apiClient.get(`/youtube/track/${youtubeId}`);
    return response.data;
  },

  // Get stream URL
  getStreamUrl: async (youtubeId) => {
    const response = await apiClient.get(`/youtube/stream/${youtubeId}`);
    return response.data.stream_url;
  },

  // Add YouTube track to library
  addTrack: async (youtubeId) => {
    const response = await apiClient.post('/youtube/add-track', null, {
      params: { youtube_id: youtubeId },
    });
    return response.data;
  },
};

// Playlist API
export const playlistAPI = {
  // Create playlist
  createPlaylist: async (name, tracks = []) => {
    const response = await apiClient.post('/playlists', {
      name,
      tracks,
    });
    return response.data;
  },

  // Get all playlists
  getPlaylists: async () => {
    const response = await apiClient.get('/playlists');
    return response.data;
  },

  // Get playlist details
  getPlaylist: async (playlistId) => {
    const response = await apiClient.get(`/playlists/${playlistId}`);
    return response.data;
  },

  // Update playlist
  updatePlaylist: async (playlistId, updates) => {
    const response = await apiClient.put(`/playlists/${playlistId}`, updates);
    return response.data;
  },

  // Delete playlist
  deletePlaylist: async (playlistId) => {
    const response = await apiClient.delete(`/playlists/${playlistId}`);
    return response.data;
  },

  // Add track to playlist
  addTrackToPlaylist: async (playlistId, trackId) => {
    const response = await apiClient.post(`/playlists/${playlistId}/tracks/${trackId}`);
    return response.data;
  },

  // Remove track from playlist
  removeTrackFromPlaylist: async (playlistId, trackId) => {
    const response = await apiClient.delete(`/playlists/${playlistId}/tracks/${trackId}`);
    return response.data;
  },
};

// Favorites API
export const favoritesAPI = {
  // Get favorite tracks
  getFavorites: async (limit = 50) => {
    const response = await apiClient.get('/favorites', { params: { limit } });
    return response.data;
  },

  // Add to favorites
  addFavorite: async (trackId) => {
    const response = await apiClient.post(`/favorites/${trackId}`);
    return response.data;
  },

  // Remove from favorites
  removeFavorite: async (trackId) => {
    const response = await apiClient.delete(`/favorites/${trackId}`);
    return response.data;
  },

  // Check if track is favorited
  isFavorite: async (trackId) => {
    const response = await apiClient.get(`/favorites/check/${trackId}`);
    return response.data.is_favorite;
  },
};

// Recommendations API
export const recommendationsAPI = {
  // Get similar tracks
  getSimilarTracks: async (trackId, limit = 10) => {
    const response = await apiClient.get(`/recommendations/similar/${trackId}`, {
      params: { limit },
    });
    return response.data;
  },

  // Get artist discography
  getArtistDiscography: async (artist, limit = 20) => {
    const response = await apiClient.get(`/recommendations/artist/${artist}`, {
      params: { limit },
    });
    return response.data;
  },

  // Get trending tracks
  getTrending: async (limit = 20) => {
    const response = await apiClient.get('/recommendations/trending', {
      params: { limit },
    });
    return response.data;
  },

  // Get fresh/new tracks
  getFresh: async (days = 7, limit = 20) => {
    const response = await apiClient.get('/recommendations/fresh', {
      params: { days, limit },
    });
    return response.data;
  },

  // Get genre tracks
  getGenreTracks: async (genre, limit = 20) => {
    const response = await apiClient.get(`/recommendations/genres/${genre}`, {
      params: { limit },
    });
    return response.data;
  },
};

// Search API
export const searchAPI = {
  // Search tracks
  searchTracks: async (query, limit = 20) => {
    const response = await apiClient.get('/search/tracks', {
      params: { q: query, limit },
    });
    return response.data;
  },

  // Search artists
  searchArtists: async (query) => {
    const response = await apiClient.get('/search/artists', {
      params: { q: query },
    });
    return response.data;
  },

  // Get search history
  getSearchHistory: async (limit = 10) => {
    const response = await apiClient.get('/search/history', {
      params: { limit },
    });
    return response.data;
  },

  // Clear search history
  clearSearchHistory: async () => {
    const response = await apiClient.delete('/search/history');
    return response.data;
  },

  // Delete search history item
  deleteSearchHistoryItem: async (query) => {
    const response = await apiClient.delete(`/search/history/${query}`);
    return response.data;
  },
};

// Helper function to handle API errors
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    return {
      message: error.response.data.detail || 'An error occurred',
      status: error.response.status,
    };
  } else if (error.request) {
    // Request was made but no response received
    return {
      message: 'Network error - please check your connection',
      status: 0,
    };
  } else {
    // Something else happened
    return {
      message: error.message || 'An unexpected error occurred',
      status: -1,
    };
  }
};

export default apiClient;