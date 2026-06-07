import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const client = axios.create({ baseURL: `${BACKEND_URL}/api/enrichment`, timeout: 10000 });

const controllers = {};
const makeCancellable = (key, config) => {
  if (controllers[key]) controllers[key].abort();
  controllers[key] = new AbortController();
  return { ...config, signal: controllers[key].signal };
};

const safe = async (fn) => {
  try { return await fn(); }
  catch (e) { if (axios.isCancel(e)) return null; throw e; }
};

export const enrichmentAPI = {
  // Artist
  getArtistProfile:   (name) => safe(() =>
    client.get(`/artist/${encodeURIComponent(name)}`).then(r => r.data)),

  getArtistTopTracks: (name, limit = 10) => safe(() =>
    client.get(`/artist/${encodeURIComponent(name)}/top-tracks`, { params: { limit } }).then(r => r.data)),

  getSimilarArtists:  (name, limit = 8) => safe(() =>
    client.get(`/artist/${encodeURIComponent(name)}/similar`, { params: { limit } }).then(r => r.data)),

  // Track
  getTrackEnrichment: (title, artist) => safe(() =>
    client.get('/track', { params: { title, artist } }).then(r => r.data)),

  getSimilarTracks:   (title, artist, limit = 8) => safe(() =>
    client.get('/track/similar', { params: { title, artist, limit } }).then(r => r.data)),

  // Lyrics (backend proxy — supports synced LRC)
  getLyrics: (title, artist, album = null, duration = null) => safe(() =>
    client.get('/lyrics', { params: { title, artist, album, duration } }).then(r => r.data)),

  searchLyrics: (q, limit = 5) => safe(() =>
    client.get('/lyrics/search', { params: { q, limit } }).then(r => r.data)),

  // Charts & Discovery
  getGlobalCharts:    (limit = 20) => safe(() =>
    client.get('/charts/global', { params: { limit } }).then(r => r.data)),

  getTrending:        (country = 'US', limit = 20) => safe(() =>
    client.get('/charts/trending', { params: { country, limit } }).then(r => r.data)),

  getGenreChart:      (genre, limit = 20) => safe(() =>
    client.get(`/charts/genre/${genre}`, { params: { limit } }).then(r => r.data)),

  getDeezerGenres:    () => safe(() =>
    client.get('/discovery/genres').then(r => r.data)),

  getGenreRadio:      (genreId, limit = 25) => safe(() =>
    client.get(`/discovery/radio/${genreId}`, { params: { limit } }).then(r => r.data)),

  // Cross-source search (Deezer + Shazam merged)
  crossSearch: (q, limit = 10) => safe(() =>
    client.get('/search', makeCancellable('cross-search', { params: { q, limit } })).then(r => r.data)),

  // Auto-tag after upload
  autoTag: (trackId) => safe(() =>
    client.post(`/auto-tag/${trackId}`).then(r => r.data)),
};
