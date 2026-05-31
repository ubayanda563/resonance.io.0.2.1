import React, { useState, useEffect, memo } from 'react';
import { TrendingUp, Radio, Globe, Loader2, Play } from 'lucide-react';
import { enrichmentAPI } from '../../services/enrichmentAPI';
import { usePlayer } from '../../contexts/PlayerContext';

const GENRES = [
  { id: 'pop',       label: 'Pop',        color: '#CC2020' },
  { id: 'hip-hop-rap', label: 'Hip-Hop', color: '#C49A28' },
  { id: 'electronic', label: 'Electronic', color: '#3A3A88' },
  { id: 'afro-beats', label: 'Afrobeats', color: '#8B6B1A' },
  { id: 'soul-rnb',  label: 'R&B / Soul', color: '#881616' },
  { id: 'dance',     label: 'Dance',      color: '#886B1A' },
  { id: 'rock',      label: 'Rock',       color: '#888890' },
  { id: 'latin',     label: 'Latin',      color: '#C49A28' },
  { id: 'k-pop',     label: 'K-Pop',      color: '#CC2020' },
];

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'ZA', name: 'South Africa'  },
  { code: 'GB', name: 'United Kingdom'},
  { code: 'NG', name: 'Nigeria'       },
  { code: 'GH', name: 'Ghana'         },
  { code: 'JP', name: 'Japan'         },
  { code: 'BR', name: 'Brazil'        },
  { code: 'DE', name: 'Germany'       },
  { code: 'FR', name: 'France'        },
];

const TrackRow = memo(({ track, index, onPlay, onQueue }) => {
  const title  = track.title  || track.name;
  const artist = track.subtitle || track.artist?.name || track.artist || '';
  const art    = track.image  || track.album?.cover;
  const preview = track.preview_url;

  return (
    <div
      onClick={() => onPlay(track)}
      className="flex items-center gap-3 p-3 glass-dark-sm rounded-xl hover:glass-dark group cursor-pointer transition-all"
    >
      <span className="text-xs text-[#3D3D45] w-5 text-right flex-shrink-0">{index + 1}</span>
      {art
        ? <img src={art} alt={title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
        : <div className="w-10 h-10 rounded-lg bg-[#1C1D26] flex-shrink-0 flex items-center justify-center text-[#3D3D45]"><Play size={13}/></div>
      }
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#EBEBED] font-medium truncate">{title}</p>
        <p className="text-xs text-[#3D3D45] truncate">{artist}</p>
      </div>
      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
        {preview && (
          <button onClick={e => { e.stopPropagation(); onQueue(track); }}
            className="text-[10px] glass-dark rounded-lg px-2 py-1 text-[#888890] hover:text-[#C49A28]">+Q</button>
        )}
        <Play size={12} className="text-[#55555E]" />
      </div>
    </div>
  );
});

const DiscoverView = memo(() => {
  const { playTrack, addToQueue } = usePlayer();
  const [tab,       setTab]     = useState('trending');
  const [country,   setCountry] = useState('ZA');
  const [genre,     setGenre]   = useState('pop');
  const [tracks,    setTracks]  = useState([]);
  const [loading,   setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setTracks([]);
    try {
      let data;
      if (tab === 'trending') data = await enrichmentAPI.getTrending(country, 20);
      else if (tab === 'genre') data = await enrichmentAPI.getGenreChart(genre, 20);
      else if (tab === 'charts') {
        const c = await enrichmentAPI.getGlobalCharts(20);
        data = c?.deezer || c?.lastfm || [];
      }
      setTracks(Array.isArray(data) ? data : []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [tab, country, genre]);

  const toTrack = (t) => ({
    title:       t.title || t.name,
    artist:      t.subtitle || t.artist?.name || t.artist || 'Unknown',
    artwork_url: t.image || t.album?.cover || '',
    preview_url: t.preview_url,
    source:      t.source || 'external',
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <TrendingUp size={22} className="text-[#C49A28]" />
        <h1 className="text-2xl font-semibold text-[#EBEBED]">Discover</h1>
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 glass-dark rounded-full p-1 w-fit">
        {[['trending', 'Trending'], ['genre', 'By Genre'], ['charts', 'Global Charts']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${tab === id ? 'glass-surface text-[#EBEBED]' : 'text-[#55555E] hover:text-[#EBEBED]'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Controls */}
      {tab === 'trending' && (
        <div className="flex flex-wrap gap-2">
          {COUNTRIES.map(c => (
            <button key={c.code} onClick={() => setCountry(c.code)}
              className={`px-3 py-1.5 rounded-full text-xs transition-all ${country === c.code ? 'btn-amber text-[#030306]' : 'glass-dark-sm text-[#888890] hover:text-[#EBEBED]'}`}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      {tab === 'genre' && (
        <div className="flex flex-wrap gap-2">
          {GENRES.map(g => (
            <button key={g.id} onClick={() => setGenre(g.id)}
              className={`px-3 py-1.5 rounded-full text-xs transition-all ${genre === g.id ? 'text-[#EBEBED]' : 'text-[#888890] hover:text-[#EBEBED]'}`}
              style={genre === g.id ? { background: `${g.color}44`, border: `1px solid ${g.color}88` } : { background: 'rgba(200,200,204,0.06)', border: '1px solid rgba(200,200,204,0.08)' }}>
              {g.label}
            </button>
          ))}
        </div>
      )}

      {/* Track list */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={22} className="animate-spin text-[#C49A28]" />
        </div>
      )}

      {!loading && tracks.length === 0 && (
        <div className="text-center py-16">
          <Radio size={32} className="mx-auto text-[#3D3D45] mb-3" />
          <p className="text-[#888890] text-sm">No tracks available</p>
          <p className="text-[#3D3D45] text-xs mt-1">Try a different country or genre</p>
        </div>
      )}

      {!loading && tracks.length > 0 && (
        <div className="space-y-1">
          {tracks.map((t, i) => (
            <TrackRow
              key={i}
              track={t}
              index={i}
              onPlay={() => playTrack(toTrack(t), tracks.map(toTrack))}
              onQueue={() => addToQueue(toTrack(t))}
            />
          ))}
        </div>
      )}
    </div>
  );
});

DiscoverView.displayName = 'DiscoverView';
export default DiscoverView;
