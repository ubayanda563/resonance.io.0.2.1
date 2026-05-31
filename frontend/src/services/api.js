import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ── Axios instances per concern (fix #17: per-request timeouts) ───────────────
const baseConfig = { baseURL: API };

const metaClient   = axios.create({ ...baseConfig, timeout: 8000  }); // search, metadata
const uploadClient = axios.create({ ...baseConfig, timeout: 120000 }); // file uploads
const streamClient = axios.create({ ...baseConfig, timeout: 15000 }); // stream URL lookups

// ── AbortController registry (fix #16) ────────────────────────────────────────
const controllers = {};

const makeRequest = async (client, config, abortKey) => {
  if (abortKey) {
    if (controllers[abortKey]) controllers[abortKey].abort();
    controllers[abortKey] = new AbortController();
    config.signal = controllers[abortKey].signal;
  }
  try {
    const res = await client.request(config);
    if (abortKey) delete controllers[abortKey];
    return res.data;
  } catch (err) {
    if (axios.isCancel(err)) return null; // cancelled — caller ignores null
    throw err;
  }
};

// ── Track API ─────────────────────────────────────────────────────────────────
export const trackAPI = {
  getTracks:       (params = {}) =>
    makeRequest(metaClient, { method: 'get', url: '/tracks', params }),

  getRecentTracks: (limit = 20) =>
    makeRequest(metaClient, { method: 'get', url: '/tracks/recent', params: { limit } }),

  getTrack:        (id) =>
    makeRequest(metaClient, { method: 'get', url: `/tracks/${id}` }),

  uploadTrack:     (file, onProgress) =>
    uploadClient.post('/tracks/upload', (() => { const f = new FormData(); f.append('file', file); return f; })(), {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => onProgress && onProgress(Math.round((e.loaded * 100) / e.total)),
    }).then(r => r.data),

  updateTrack:     (id, data) =>
    makeRequest(metaClient, { method: 'put', url: `/tracks/${id}`, data }),

  deleteTrack:     (id) =>
    makeRequest(metaClient, { method: 'delete', url: `/tracks/${id}` }),

  getStreamUrl:    (id) => `${API}/tracks/${id}/stream`,

  getLibraryStats: () =>
    makeRequest(metaClient, { method: 'get', url: '/tracks/stats' }),
};

// ── YouTube API ───────────────────────────────────────────────────────────────
export const youtubeAPI = {
  search: (query, limit = 10) =>
    makeRequest(metaClient, { method: 'get', url: '/youtube/search', params: { q: query, limit } }, 'youtube-search'),

  getTrackInfo: (id) =>
    makeRequest(streamClient, { method: 'get', url: `/youtube/track/${id}` }),

  getStreamUrl: async (id) => {
    const data = await makeRequest(streamClient, { method: 'get', url: `/youtube/stream/${id}` });
    return data?.stream_url ?? null;
  },

  addTrack: (youtubeId) =>
    makeRequest(metaClient, { method: 'post', url: '/youtube/add-track', params: { youtube_id: youtubeId } }),

  incrementPlayCount: (youtubeId) =>
    makeRequest(metaClient, { method: 'post', url: `/youtube/play/${youtubeId}` }).catch(() => {}),
};

// ── Playlist API ──────────────────────────────────────────────────────────────
export const playlistAPI = {
  createPlaylist:        (name, tracks = []) =>
    makeRequest(metaClient, { method: 'post', url: '/playlists', data: { name, tracks } }),

  getPlaylists:          () =>
    makeRequest(metaClient, { method: 'get', url: '/playlists' }),

  getPlaylist:           (id) =>
    makeRequest(metaClient, { method: 'get', url: `/playlists/${id}` }),

  updatePlaylist:        (id, updates) =>
    makeRequest(metaClient, { method: 'put', url: `/playlists/${id}`, data: updates }),

  deletePlaylist:        (id) =>
    makeRequest(metaClient, { method: 'delete', url: `/playlists/${id}` }),

  addTrackToPlaylist:    (playlistId, trackId) =>
    makeRequest(metaClient, { method: 'post', url: `/playlists/${playlistId}/tracks/${trackId}` }),

  removeTrackFromPlaylist: (playlistId, trackId) =>
    makeRequest(metaClient, { method: 'delete', url: `/playlists/${playlistId}/tracks/${trackId}` }),
};

// ── Favorites API ─────────────────────────────────────────────────────────────
export const favoritesAPI = {
  getFavorites:   (limit = 50) =>
    makeRequest(metaClient, { method: 'get', url: '/favorites', params: { limit } }),

  addFavorite:    (id) =>
    makeRequest(metaClient, { method: 'post', url: `/favorites/${id}` }),

  removeFavorite: (id) =>
    makeRequest(metaClient, { method: 'delete', url: `/favorites/${id}` }),

  isFavorite:     async (id) => {
    const d = await makeRequest(metaClient, { method: 'get', url: `/favorites/check/${id}` });
    return d?.is_favorite ?? false;
  },
};

// ── Recommendations API ───────────────────────────────────────────────────────
export const recommendationsAPI = {
  getSimilarTracks:    (id, limit = 10) =>
    makeRequest(metaClient, { method: 'get', url: `/recommendations/similar/${id}`, params: { limit } }),

  getArtistDiscography: (artist, limit = 20) =>
    makeRequest(metaClient, { method: 'get', url: `/recommendations/artist/${artist}`, params: { limit } }),

  getTrending: (limit = 20) =>
    makeRequest(metaClient, { method: 'get', url: '/recommendations/trending', params: { limit } }),

  getFresh: (days = 7, limit = 20) =>
    makeRequest(metaClient, { method: 'get', url: '/recommendations/fresh', params: { days, limit } }),

  getGenreTracks: (genre, limit = 20) =>
    makeRequest(metaClient, { method: 'get', url: `/recommendations/genres/${genre}`, params: { limit } }),
};

// ── Search API ────────────────────────────────────────────────────────────────
export const searchAPI = {
  searchTracks:  (query, limit = 20) =>
    makeRequest(metaClient, { method: 'get', url: '/search/tracks', params: { q: query, limit } }, 'search-tracks'),

  searchArtists: (query) =>
    makeRequest(metaClient, { method: 'get', url: '/search/artists', params: { q: query } }, 'search-artists'),

  getSearchHistory:      (limit = 10) =>
    makeRequest(metaClient, { method: 'get', url: '/search/history', params: { limit } }),

  clearSearchHistory:    () =>
    makeRequest(metaClient, { method: 'delete', url: '/search/history' }),

  deleteSearchHistoryItem: (query) =>
    makeRequest(metaClient, { method: 'delete', url: `/search/history/${query}` }),
};

// ── Error helper ──────────────────────────────────────────────────────────────
export const handleApiError = (err) => {
  if (err?.response) return { message: err.response.data?.detail || 'An error occurred', status: err.response.status };
  if (err?.request)  return { message: 'Network error — check your connection', status: 0 };
  return { message: err?.message || 'Unexpected error', status: -1 };
};

export default metaClient;
