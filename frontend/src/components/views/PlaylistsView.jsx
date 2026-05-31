import React, { useState, useEffect, memo } from 'react';
import { Plus, Play, Trash2, Loader2 } from 'lucide-react';
import { playlistAPI } from '../../services/api';
import { usePlayer } from '../../contexts/PlayerContext';
import PlaylistMosaic from '../PlaylistMosaic';

const PlaylistsView = memo(() => {
  const { playTrack } = usePlayer();
  const [playlists, setPlaylists] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [newName,   setNewName]   = useState('');
  const [creating,  setCreating]  = useState(false);
  const [selected,  setSelected]  = useState(null); // opened playlist

  useEffect(() => {
    playlistAPI.getPlaylists()
      .then(p => { setPlaylists(p || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const createPlaylist = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const pl = await playlistAPI.createPlaylist(newName.trim());
      if (pl) setPlaylists(prev => [pl, ...prev]);
      setNewName('');
    } finally { setCreating(false); }
  };

  const deletePlaylist = async (id, e) => {
    e.stopPropagation();
    setPlaylists(prev => prev.filter(p => (p.id || p._id) !== id));
    await playlistAPI.deletePlaylist(id).catch(() => {});
  };

  const openPlaylist = async (pl) => {
    const id = pl.id || pl._id;
    const full = await playlistAPI.getPlaylist(id).catch(() => null);
    setSelected(full || pl);
  };

  if (selected) {
    const tracks = selected.tracks || [];
    return (
      <div className="flex flex-col gap-5">
        <button onClick={() => setSelected(null)} className="text-xs text-[#55555E] hover:text-[#EBEBED] text-left">
          ← Back to playlists
        </button>

        <div className="flex items-center gap-5">
          <PlaylistMosaic
            artworkUrls={tracks.slice(0, 4).map(t => t.artwork_url)}
            size={96}
            className="rounded-2xl flex-shrink-0"
          />
          <div>
            <p className="text-xs uppercase tracking-[0.5em] text-[#3D3D45]">Playlist</p>
            <h2 className="text-3xl font-semibold text-[#EBEBED] mt-1">{selected.name}</h2>
            <p className="text-[#888890] text-sm mt-1">{tracks.length} tracks</p>
          </div>
        </div>

        {tracks.length === 0 && (
          <p className="text-[#3D3D45] text-sm text-center py-10">This playlist is empty.</p>
        )}

        <div className="space-y-1">
          {tracks.map((track, i) => (
            <div
              key={track.id || track._id || i}
              onClick={() => playTrack(track, tracks)}
              className="flex items-center gap-4 p-3 glass-dark-sm rounded-xl hover:glass-dark cursor-pointer transition-all group"
            >
              <span className="text-xs text-[#3D3D45] w-5 text-right">{i + 1}</span>
              <img src={track.artwork_url} alt={track.title} className="w-10 h-10 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#EBEBED] font-medium truncate">{track.title}</p>
                <p className="text-xs text-[#3D3D45] truncate">{track.artist}</p>
              </div>
              <Play size={14} className="text-[#55555E] opacity-0 group-hover:opacity-100 transition" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-[#EBEBED]">Playlists</h1>

      {/* Create */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && createPlaylist()}
          placeholder="New playlist name…"
          className="glass-input flex-1 px-4 py-2.5 text-sm rounded-xl"
        />
        <button
          onClick={createPlaylist}
          disabled={creating || !newName.trim()}
          className="btn-amber rounded-xl px-4 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50"
        >
          {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Create
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[#C49A28]" />
        </div>
      )}

      {!loading && playlists.length === 0 && (
        <div className="text-center py-20">
          <p className="text-[#888890]">No playlists yet</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {playlists.map(pl => {
          const id = pl.id || pl._id;
          return (
            <div
              key={id}
              onClick={() => openPlaylist(pl)}
              className="glass-card-dark rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-2xl transition-all group"
            >
              <PlaylistMosaic
                artworkUrls={pl.artwork_urls || []}
                size={160}
                className="w-full aspect-square"
              />
              <div className="p-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#EBEBED] truncate">{pl.name}</p>
                  <p className="text-xs text-[#3D3D45]">{pl.track_count ?? 0} tracks</p>
                </div>
                <button
                  onClick={(e) => deletePlaylist(id, e)}
                  className="p-1 text-[#3D3D45] hover:text-[#CC2020] transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

PlaylistsView.displayName = 'PlaylistsView';
export default PlaylistsView;
