import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { favoritesAPI } from '../services/api';

const FavoritesContext = createContext();

export const useFavoritesContext = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavoritesContext must be used within FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState(new Set());

  // Load favorites on mount
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = useCallback(async () => {
    setLoadingFavorites(true);
    try {
      const data = await favoritesAPI.getFavorites(500);
      setFavorites(data);
      const ids = new Set(data.map(t => t._id || t.id));
      setFavoriteIds(ids);
    } catch (err) {
      console.error('Error loading favorites:', err);
    } finally {
      setLoadingFavorites(false);
    }
  }, []);

  const toggleFavorite = useCallback(async (trackId) => {
    try {
      if (favoriteIds.has(trackId)) {
        await favoritesAPI.removeFavorite(trackId);
        const newIds = new Set(favoriteIds);
        newIds.delete(trackId);
        setFavoriteIds(newIds);
        setFavorites(favorites.filter(t => (t._id || t.id) !== trackId));
      } else {
        await favoritesAPI.addFavorite(trackId);
        const newIds = new Set(favoriteIds);
        newIds.add(trackId);
        setFavoriteIds(newIds);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      throw err;
    }
  }, [favorites, favoriteIds]);

  const isFavorite = useCallback((trackId) => {
    return favoriteIds.has(trackId);
  }, [favoriteIds]);

  const value = {
    favorites,
    favoriteIds,
    loadingFavorites,
    loadFavorites,
    toggleFavorite,
    isFavorite,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};
