# Resonance Music Player - Backend Integration Contracts

## API Contracts

### Music Management
- `POST /api/tracks/upload` - Upload local audio files
- `GET /api/tracks` - Get user's music library
- `GET /api/tracks/recent` - Get recently added tracks
- `DELETE /api/tracks/:id` - Delete a track
- `PUT /api/tracks/:id` - Update track metadata

### YouTube Music Integration
- `GET /api/youtube/search?q={query}` - Search YouTube Music
- `GET /api/youtube/track/:id` - Get track details and stream URL
- `POST /api/youtube/playlist` - Create playlist from YouTube tracks

### Playlist Management
- `GET /api/playlists` - Get user playlists
- `POST /api/playlists` - Create new playlist
- `PUT /api/playlists/:id` - Update playlist
- `DELETE /api/playlists/:id` - Delete playlist
- `POST /api/playlists/:id/tracks` - Add tracks to playlist

### User Preferences
- `GET /api/user/library` - Get library organization preferences
- `PUT /api/user/library` - Update library preferences
- `GET /api/user/queue` - Get current queue
- `PUT /api/user/queue` - Update queue

## Mock Data to Replace

### Frontend Mock Files
- `/src/data/mockData.js` - Replace with API calls
  - `mockLibraryData` → API call to `/api/tracks` with categorization
  - `mockRecentlyAdded` → API call to `/api/tracks/recent`
  - `mockCurrentTrack` → User's current playing track state

### Mock Data Replacement Strategy
1. **Library Categories**: Replace static data with dynamic track counting
2. **Recently Added**: Real uploaded tracks with timestamps
3. **Current Track**: Actual playback state management
4. **Album Artwork**: File uploads or YouTube thumbnail URLs

## Backend Implementation Plan

### Database Models
```python
class Track:
    - id: ObjectId
    - title: str
    - artist: str
    - album: str (optional)
    - duration: int (seconds)
    - file_path: str (for local files)
    - youtube_url: str (for streamed tracks)
    - artwork_url: str
    - upload_date: datetime
    - play_count: int
    - user_rating: int (1-5)

class Playlist:
    - id: ObjectId
    - name: str
    - tracks: List[ObjectId]
    - created_date: datetime
    - updated_date: datetime

class UserPreferences:
    - id: ObjectId
    - current_track: ObjectId
    - queue: List[ObjectId]
    - shuffle: bool
    - repeat: str (none/track/playlist)
```

### File Upload Strategy
- Use chunked uploads for large audio files
- Store files in `/app/backend/uploads/audio/`
- Extract metadata using `mutagen` library
- Generate thumbnails for audio files without artwork

### YouTube Integration
- Use `youtube-dl` or `yt-dlp` for track extraction
- Cache stream URLs (expire after 6 hours)
- Store track metadata in database
- Handle rate limiting and API quotas

## Frontend Integration Changes

### Component Updates
1. **ResonanceApp.jsx**:
   - Replace `mockLibraryData` import with API call
   - Add file upload interface
   - Implement real audio playback using HTML5 Audio API
   - Add YouTube search functionality

2. **New Components to Add**:
   - `FileUploadDialog.jsx` - Drag & drop audio file upload
   - `YouTubeSearch.jsx` - Search and add YouTube tracks  
   - `PlaybackManager.jsx` - Handle audio playback logic
   - `LibraryManager.jsx` - Manage local and streamed tracks

### State Management
- Add proper track playback state
- Implement queue management
- Handle loading states for uploads and streaming
- Add error handling for failed uploads or stream errors

## Testing Strategy
- Upload various audio formats (MP3, FLAC, AAC)
- Test YouTube search and playback
- Verify metadata extraction
- Test large file uploads
- Validate streaming functionality