import React, { useState, Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';
import { PlayerProvider } from '../contexts/PlayerContext';
import { FavoritesProvider } from '../contexts/FavoritesContext';
import Sidebar from './Sidebar';
import BottomPlayerBar from './player/BottomPlayerBar';

// Fix #1 — lazy-load each view so only the active view's bundle loads
const HomeView      = lazy(() => import('./views/HomeView'));
const SearchView    = lazy(() => import('./views/SearchView'));
const LibraryView   = lazy(() => import('./views/LibraryView'));
const PlaylistsView  = lazy(() => import('./views/PlaylistsView'));
const DiscoverView   = lazy(() => import('./views/DiscoverView'));

const ViewLoader = () => (
  <div className="flex items-center justify-center h-64">
    <Loader2 size={24} className="animate-spin text-[#C49A28]" />
  </div>
);

const AppShell = () => {
  const [view, setView]                     = useState('home');
  const [playlistTrackTarget, setPlaylistTrackTarget] = useState(null);

  // Fix #15 — only set target while dialog is open; clear atomically
  const handleAddToPlaylist = (track) => setPlaylistTrackTarget(track);
  const handlePlaylistDialogClose = () => setPlaylistTrackTarget(null);

  return (
    <div className="flex h-screen bg-[#030306] text-[#EBEBED] overflow-hidden">
      <Sidebar view={view} onNavigate={setView} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto scroll-chrome px-4 md:px-8 py-6">
          <Suspense fallback={<ViewLoader />}>
            {view === 'home'      && <HomeView />}
            {view === 'search'    && <SearchView />}
            {view === 'library'   && <LibraryView onAddToPlaylist={handleAddToPlaylist} />}
            {view === 'playlists' && <PlaylistsView />}
            {view === 'favorites' && (
              <Suspense fallback={<ViewLoader />}>
                {React.createElement(lazy(() => import('./views/FavoritesView')))}
              </Suspense>
            )}
            {view === 'discover' && <DiscoverView />}
            {view === 'youtube' && (
              <Suspense fallback={<ViewLoader />}>
                {React.createElement(lazy(() => import('./views/YouTubeView')))}
              </Suspense>
            )}
          </Suspense>
        </div>

        <BottomPlayerBar />
      </main>
    </div>
  );
};

/**
 * ResonanceApp — root component.
 * Providers are at the top so all child components share the same
 * audio player state and favorites state without prop-drilling.
 */
const ResonanceApp = () => (
  <PlayerProvider>
    <FavoritesProvider>
      <AppShell />
    </FavoritesProvider>
  </PlayerProvider>
);

export default ResonanceApp;
