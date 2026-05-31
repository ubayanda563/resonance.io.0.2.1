import React, { createContext, useContext } from 'react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { trackAPI, youtubeAPI } from '../services/api';

const PlayerContext = createContext(null);

export const PlayerProvider = ({ children }) => {
  const player = useAudioPlayer(trackAPI, youtubeAPI);
  return <PlayerContext.Provider value={player}>{children}</PlayerContext.Provider>;
};

export const usePlayer = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used inside PlayerProvider');
  return ctx;
};
