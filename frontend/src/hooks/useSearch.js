import { useState, useCallback, useEffect } from 'react';
import { searchAPI } from '../services/api';

export const useSearch = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [searchArtistResults, setSearchArtistResults] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Load search history on mount
  useEffect(() => {
    loadSearchHistory();
  }, []);

  const loadSearchHistory = useCallback(async () => {
    try {
      const history = await searchAPI.getSearchHistory(15);
      setSearchHistory(history);
    } catch (err) {
      console.error('Error loading search history:', err);
    }
  }, []);

  const searchTracks = useCallback(async (query, limit = 30) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    try {
      const results = await searchAPI.searchTracks(query, limit);
      setSearchResults(results);
      await loadSearchHistory(); // Refresh history after search
    } catch (err) {
      setSearchError(err.message);
      console.error('Error searching tracks:', err);
    } finally {
      setIsSearching(false);
    }
  }, [loadSearchHistory]);

  const searchArtists = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchArtistResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    try {
      const results = await searchAPI.searchArtists(query);
      setSearchArtistResults(results);
    } catch (err) {
      setSearchError(err.message);
      console.error('Error searching artists:', err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearSearchHistory = useCallback(async () => {
    try {
      await searchAPI.clearSearchHistory();
      setSearchHistory([]);
    } catch (err) {
      console.error('Error clearing search history:', err);
    }
  }, []);

  const deleteHistoryItem = useCallback(async (query) => {
    try {
      await searchAPI.deleteSearchHistoryItem(query);
      setSearchHistory(searchHistory.filter(h => h.query !== query));
    } catch (err) {
      console.error('Error deleting history item:', err);
    }
  }, [searchHistory]);

  const clearResults = useCallback(() => {
    setSearchResults([]);
    setSearchArtistResults([]);
    setSelectedResult(null);
  }, []);

  return {
    searchResults,
    searchArtistResults,
    searchHistory,
    selectedResult,
    isSearching,
    searchError,
    searchTracks,
    searchArtists,
    clearSearchHistory,
    deleteHistoryItem,
    clearResults,
    setSelectedResult,
    loadSearchHistory,
  };
};
