import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { favoritesAPI } from '../services/api';

const FavoritesContext = createContext(null);

export const FavoritesProvider = ({ children }) => {
  const [favoriteIds, setFavoriteIds] = useState(new Set());

  useEffect(() => {
    favoritesAPI.getFavorites(500)
      .then(tracks => {
        if (tracks) setFavoriteIds(new Set(tracks.map(t => t.id || t._id)));
      })
      .catch(() => {});
  }, []);

  const isFavorite = useCallback((id) => favoriteIds.has(id), [favoriteIds]);

  const toggleFavorite = useCallback(async (id) => {
    const wasFav = favoriteIds.has(id);
    // Optimistic update
    setFavoriteIds(prev => {
      const next = new Set(prev);
      wasFav ? next.delete(id) : next.add(id);
      return next;
    });
    try {
      if (wasFav) await favoritesAPI.removeFavorite(id);
      else        await favoritesAPI.addFavorite(id);
    } catch {
      // Rollback
      setFavoriteIds(prev => {
        const next = new Set(prev);
        wasFav ? next.add(id) : next.delete(id);
        return next;
      });
    }
  }, [favoriteIds]);

  return (
    <FavoritesContext.Provider value={{ favoriteIds, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavoritesContext = () => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavoritesContext must be inside FavoritesProvider');
  return ctx;
};
