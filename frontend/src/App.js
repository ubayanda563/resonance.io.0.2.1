import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ResonanceApp from './components/ResonanceApp';
import { PlaylistProvider } from './contexts/PlaylistContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import './App.css';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <FavoritesProvider>
          <PlaylistProvider>
            <Routes>
              <Route path="/" element={<ResonanceApp />} />
            </Routes>
          </PlaylistProvider>
        </FavoritesProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;