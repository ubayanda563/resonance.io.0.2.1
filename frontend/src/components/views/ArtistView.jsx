import React, { useState, useEffect, memo } from 'react';
import { ArrowLeft, Music, Users, Play, ExternalLink, Loader2 } from 'lucide-react';
import { enrichmentAPI } from '../../services/enrichmentAPI';
import { usePlayer } from '../../contexts/PlayerContext';

const ArtistView = memo(({ artistName, onBack }) => {
  const { playTrack, addToQueue } = usePlayer();
  const [profile,  setProfile]  = useState(null);
  const [tracks,   setTracks]   = useState([]);
  const [similar,  setSimilar]  = useState([]);
  const [tab,      setTab]      = useState('tracks');
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!artistName) return;
    setLoading(true);
    Promise.all([
      enrichmentAPI.getArtistProfile(artistName),
      enrichmentAPI.getArtistTopTracks(artistName, 10),
      enrichmentAPI.getSimilarArtists(artistName, 8),
    ]).then(([prof, top, sim]) => {
      setProfile(prof);
      setTracks(top  || []);
      setSimilar(sim || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [artistName]);

  const formatNum = (n) => {
    if (!n) return '—';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={24} className="animate-spin text-[#C49A28]" />
    </div>
  );

  if (!profile) return (
    <div className="text-center py-16">
      <p className="text-[#888890]">Artist not found</p>
      <button onClick={onBack} className="mt-4 text-xs text-[#55555E] hover:text-[#EBEBED]">← Back</button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-2 text-[#55555E] hover:text-[#EBEBED] text-sm w-fit transition-colors">
        <ArrowLeft size={14} /> Back
      </button>

      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden glass-card-dark">
        {profile.image && (
          <div className="absolute inset-0">
            <img src={profile.image} alt="" className="w-full h-full object-cover opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#030306] via-[#030306]/70 to-transparent" />
          </div>
        )}
        <div className="relative p-6 flex items-end gap-5">
          {profile.image && (
            <img src={profile.image} alt={profile.name}
              className="w-24 h-24 rounded-2xl object-cover ring-2 ring-[rgba(200,200,204,0.15)] flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[9px] uppercase tracking-[0.5em] text-[#3D3D45] mb-1">Artist</p>
            <h1 className="text-3xl font-semibold text-[#EBEBED] mb-2">{profile.name}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-[#888890]">
              {profile.listeners  && <span><span className="text-[#EBEBED] font-medium">{formatNum(profile.listeners)}</span> listeners</span>}
              {profile.fan_count  && <span><span className="text-[#EBEBED] font-medium">{formatNum(profile.fan_count)}</span> fans</span>}
              {profile.country    && <span>📍 {profile.country}</span>}
              {profile.begin_year && <span>Est. {profile.begin_year}</span>}
            </div>
            {profile.genres?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {profile.genres.slice(0, 5).map(g => (
                  <span key={g} className="text-[10px] px-2.5 py-0.5 glass-dark-sm rounded-full text-[#888890]">{g}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="text-[#888890] text-sm leading-relaxed line-clamp-4 glass-dark-sm rounded-2xl p-4">{profile.bio}</p>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 glass-dark rounded-full p-1 w-fit">
        {['tracks', 'albums', 'similar'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${tab === t ? 'glass-surface text-[#EBEBED]' : 'text-[#55555E] hover:text-[#EBEBED]'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Top Tracks */}
      {tab === 'tracks' && (
        <div className="space-y-1">
          {tracks.length === 0 && <p className="text-[#3D3D45] text-sm text-center py-8">No tracks found</p>}
          {tracks.map((t, i) => {
            const title  = t.title  || t.name;
            const artist = t.artist?.name || profile.name;
            const art    = t.album?.cover || t.image;
            const preview = t.preview_url;
            return (
              <div key={i} className="flex items-center gap-4 p-3 glass-dark-sm rounded-xl hover:glass-dark group cursor-pointer transition-all"
                onClick={() => preview && playTrack({ title, artist, artwork_url: art, youtube_url: preview, source: 'deezer-preview' }, tracks)}>
                <span className="text-xs text-[#3D3D45] w-5 text-right flex-shrink-0">{i + 1}</span>
                {art && <img src={art} alt={title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#EBEBED] truncate">{title}</p>
                  <p className="text-xs text-[#3D3D45]">{t.play_count ? `${formatNum(t.play_count)} plays` : t.album?.title || ''}</p>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                  {preview && (
                    <button onClick={e => { e.stopPropagation(); addToQueue({ title, artist, artwork_url: art, preview_url: preview }); }}
                      className="text-xs text-[#55555E] hover:text-[#C49A28] px-2 py-1 glass-dark rounded-lg">+Q</button>
                  )}
                  <Play size={13} className="text-[#55555E]" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Albums (discography from MusicBrainz) */}
      {tab === 'albums' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(profile.discography || []).slice(0, 12).map((release, i) => (
            <div key={i} className="glass-card-dark rounded-2xl overflow-hidden">
              <div className="aspect-square bg-[#1C1D26] flex items-center justify-center">
                <Music size={28} className="text-[#3D3D45]" />
              </div>
              <div className="p-3">
                <p className="text-xs font-medium text-[#EBEBED] truncate">{release.title}</p>
                <p className="text-[10px] text-[#3D3D45]">{release.type} · {release.year}</p>
              </div>
            </div>
          ))}
          {(!profile.discography?.length) && <p className="text-[#3D3D45] text-sm col-span-4 text-center py-8">No albums found</p>}
        </div>
      )}

      {/* Similar Artists */}
      {tab === 'similar' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {similar.length === 0 && <p className="text-[#3D3D45] text-sm col-span-4 text-center py-8">No similar artists found</p>}
          {similar.map((a, i) => (
            <div key={i} className="glass-card-dark rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-1 transition-all">
              {a.image
                ? <img src={a.image} alt={a.name} className="w-full aspect-square object-cover" />
                : <div className="aspect-square bg-[#1C1D26] flex items-center justify-center"><Users size={24} className="text-[#3D3D45]" /></div>
              }
              <div className="p-3">
                <p className="text-sm font-medium text-[#EBEBED] truncate">{a.name}</p>
                <p className="text-[10px] text-[#3D3D45]">{Math.round((a.match || 0) * 100)}% match</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* External links */}
      {Object.keys(profile.urls || {}).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(profile.urls).map(([platform, url]) => (
            <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 glass-dark-sm rounded-full px-3 py-1.5 text-xs text-[#888890] hover:text-[#EBEBED] transition-colors capitalize">
              <ExternalLink size={10} /> {platform}
            </a>
          ))}
        </div>
      )}
    </div>
  );
});

ArtistView.displayName = 'ArtistView';
export default ArtistView;
