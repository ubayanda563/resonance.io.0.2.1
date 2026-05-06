import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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