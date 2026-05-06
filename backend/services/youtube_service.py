import yt_dlp
import re
from typing import List, Optional, Dict
from models import YouTubeSearchResult
import logging

logger = logging.getLogger(__name__)


class YouTubeService:
    def __init__(self):
        self.ydl_opts = {
            'format': 'bestaudio/best',
            'noplaylist': True,
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
        }
    
    def search_tracks(self, query: str, limit: int = 10) -> List[YouTubeSearchResult]:
        """Search for tracks on YouTube Music"""
        try:
            search_query = f"ytsearch{limit}:{query} music"
            
            with yt_dlp.YoutubeDL(self.ydl_opts) as ydl:
                search_results = ydl.extract_info(search_query, download=False)
                
                tracks = []
                if 'entries' in search_results:
                    for entry in search_results['entries']:
                        if entry:
                            track = self._parse_youtube_entry(entry)
                            if track:
                                tracks.append(track)
                
                return tracks
        except Exception as e:
            logger.error(f"YouTube search error: {str(e)}")
            return []
    
    def get_track_info(self, youtube_id: str) -> Optional[Dict]:
        """Get detailed track information from YouTube ID"""
        try:
            url = f"https://www.youtube.com/watch?v={youtube_id}"
            
            with yt_dlp.YoutubeDL(self.ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                return self._parse_youtube_entry(info)
        except Exception as e:
            logger.error(f"YouTube track info error: {str(e)}")
            return None
    
    def get_stream_url(self, youtube_id: str) -> Optional[str]:
        """Get the direct stream URL for a YouTube video"""
        try:
            url = f"https://www.youtube.com/watch?v={youtube_id}"
            
            opts = {
                **self.ydl_opts,
                'format': 'bestaudio[ext=m4a]/bestaudio/best',
            }
            
            with yt_dlp.YoutubeDL(opts) as ydl:
                info = ydl.extract_info(url, download=False)
                
                if 'url' in info:
                    return info['url']
                elif 'formats' in info and info['formats']:
                    # Get the best audio format
                    audio_formats = [f for f in info['formats'] if f.get('acodec') != 'none']
                    if audio_formats:
                        return audio_formats[0]['url']
                
                return None
        except Exception as e:
            logger.error(f"YouTube stream URL error: {str(e)}")
            return None
    
    def _parse_youtube_entry(self, entry: Dict) -> Optional[YouTubeSearchResult]:
        """Parse YouTube entry into our track format"""
        try:
            # Extract artist and title from the title
            title = entry.get('title', '')
            artist = entry.get('uploader', 'Unknown Artist')
            
            # Try to parse "Artist - Title" format
            if ' - ' in title:
                parts = title.split(' - ', 1)
                if len(parts) == 2:
                    artist = parts[0].strip()
                    title = parts[1].strip()
            
            # Clean up common music video suffixes
            title = re.sub(r'\s*\(Official.*\)|\s*\[Official.*\]|\s*- Official.*', '', title, flags=re.IGNORECASE)
            title = re.sub(r'\s*\(.*Video.*\)|\s*\[.*Video.*\]', '', title, flags=re.IGNORECASE)
            title = title.strip()
            
            # Get thumbnail
            thumbnail = ''
            if 'thumbnails' in entry and entry['thumbnails']:
                # Get the highest quality thumbnail
                thumbnails = sorted(entry['thumbnails'], key=lambda x: x.get('width', 0), reverse=True)
                thumbnail = thumbnails[0]['url']
            
            return YouTubeSearchResult(
                id=entry['id'],
                title=title,
                artist=artist,
                duration=entry.get('duration', 0) or 0,
                thumbnail=thumbnail,
                url=entry.get('webpage_url', f"https://www.youtube.com/watch?v={entry['id']}")
            )
        except Exception as e:
            logger.error(f"Error parsing YouTube entry: {str(e)}")
            return None