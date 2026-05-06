import { Music, Folder, User, Disc, Clock, List, Users, Headphones, Star, Bookmark, MoreHorizontal } from 'lucide-react';

export const mockLibraryData = [
  {
    id: 'all-songs',
    title: 'ALL SONGS',
    icon: <Music size={20} />,
    color: 'default'
  },
  {
    id: 'folders',
    title: 'FOLDERS',
    icon: <Folder size={20} />,
    color: 'default'
  },
  {
    id: 'folders-hierarchy',
    title: 'FOLDERS',
    subtitle: 'HIERARCHY',
    icon: <Folder size={20} />,
    color: 'default'
  },
  {
    id: 'albums',
    title: 'ALBUMS',
    icon: <Disc size={20} />,
    color: 'default'
  },
  {
    id: 'artists',
    title: 'ARTISTS',
    icon: <User size={20} />,
    color: 'default'
  },
  {
    id: 'album-artists',
    title: 'ALBUM ARTISTS',
    icon: <Users size={20} />,
    color: 'default'
  },
  {
    id: 'albums-by-artist',
    title: 'ALBUMS BY',
    subtitle: 'ARTIST',
    icon: <User size={20} />,
    color: 'default'
  },
  {
    id: 'genres',
    title: 'GENRES',
    icon: <Headphones size={20} />,
    color: 'default'
  },
  {
    id: 'years',
    title: 'YEARS',
    icon: <Clock size={20} />,
    color: 'default'
  },
  {
    id: 'composers',
    title: 'COMPOSERS',
    icon: <Users size={20} />,
    color: 'default'
  },
  {
    id: 'playlists',
    title: 'PLAYLISTS',
    icon: <List size={20} />,
    color: 'default'
  },
  {
    id: 'streams',
    title: 'STREAMS',
    icon: <Headphones size={20} />,
    color: 'default'
  },
  {
    id: 'queue',
    title: 'QUEUE',
    subtitle: '0/1',
    icon: <List size={20} />,
    color: 'default'
  },
  {
    id: 'bookmarks',
    title: 'BOOKMARKS',
    icon: <Bookmark size={20} />,
    color: 'default'
  },
  {
    id: 'most-played',
    title: 'MOST PLAYED',
    icon: <Star size={20} />,
    color: 'default'
  },
  {
    id: 'top-rated',
    title: 'TOP RATED',
    icon: <Star size={20} />,
    color: 'red'
  },
  {
    id: 'low-rated',
    title: 'LOW RATED',
    icon: <Star size={20} />,
    color: 'red'
  },
  {
    id: 'recently-played',
    title: 'RECENTLY PLAYED',
    icon: <Clock size={20} />,
    color: 'default'
  },
  {
    id: 'recently-added',
    title: 'RECENTLY ADDED',
    icon: <Clock size={20} />,
    color: 'default'
  },
  {
    id: 'long',
    title: 'LONG',
    icon: <MoreHorizontal size={20} />,
    color: 'default'
  }
];

export const mockRecentlyAdded = [
  {
    id: 1,
    title: 'MISS MY DOGS',
    artist: 'YOUNG THUG — UY SC ...',
    artwork: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center'
  },
  {
    id: 2,
    title: 'AUD-20250926-W...',
    artist: 'UNKNOWN ARTIST',
    artwork: 'https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?w=400&h=400&fit=crop&crop=center'
  },
  {
    id: 3,
    title: 'DREAMS RARELY D...',
    artist: 'YOUNG THUG; MARIAH ...',
    artwork: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center'
  },
  {
    id: 4,
    title: 'WHADDUP JESUS ...',
    artist: 'YOUNG THUG; YFN LU ...',
    artwork: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center'
  },
  {
    id: 5,
    title: 'PIPE DOWN (FEAT. ...',
    artist: 'YOUNG THUG; TRAVIS ...',
    artwork: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&center'
  },
  {
    id: 6,
    title: 'MONEY ON MONE ...',
    artist: 'YOUNG THUG; FUTURE ...',
    artwork: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center'
  },
  {
    id: 7,
    title: 'SAD SPIDER',
    artist: 'YOUNG THUG — UY SC ...',
    artwork: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center'
  },
  {
    id: 8,
    title: 'FUCKING TOLD U',
    artist: 'YOUNG THUG — UY SC ...',
    artwork: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center'
  },
  {
    id: 9,
    title: 'YUCK (FEAT. KEN C...',
    artist: 'YOUNG THUG; KEN CA ...',
    artwork: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center'
  }
];

export const mockCurrentTrack = {
  id: 'current',
  title: 'LIPSTAIN',
  artist: 'DOJA CAT — VIE | [COZYOGSWAY]',
  artwork: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&h=800&fit=crop&crop=center',
  duration: '3:23',
  currentTime: '0:32'
};