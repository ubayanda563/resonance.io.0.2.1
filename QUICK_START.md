# 🎵 Resonance Music Player - Quick Start Guide

## Prerequisites
- Node.js 16+ and npm/yarn installed
- Python 3.8+ installed
- MongoDB (optional - app can work in-memory without it)

## One-Command Setup

### Backend Setup (Python/FastAPI)
```bash
cd backend
pip install -r requirements.txt
python server.py
```

Backend will run on: `http://localhost:8001`

### Frontend Setup (React)
In a separate terminal:
```bash
cd frontend
npm install  # or yarn install
npm start    # or yarn start
```

Frontend will run on: `http://localhost:3000`

## What You Get

✅ **Music Library** - Upload and manage your music files
✅ **Playlists** - Create and organize playlists
✅ **Favorites** - Mark your favorite tracks
✅ **Search** - Find tracks, artists, and albums
✅ **Recommendations** - AI-powered music suggestions
✅ **YouTube Integration** - Search and stream from YouTube
✅ **Keyboard Shortcuts** - Control playback with hotkeys

## Key Features

### Keyboard Controls
- `Space` - Play/Pause
- `→ or N` - Next track
- `← or P` - Previous track
- `S` - Toggle shuffle
- `R` - Cycle repeat modes
- `?` - Show help

### API Endpoints
- `GET /api/health` - Health check
- `POST /api/tracks/upload` - Upload audio files
- `GET /api/tracks` - Get all tracks
- `GET /api/playlists` - Get playlists
- `GET /api/favorites` - Get favorite tracks
- `GET /api/search` - Search tracks

## Configuration Files

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017  # Optional
DB_NAME=resonance
ALLOWED_ORIGINS=http://localhost:3000
LASTFM_API_KEY=                      # Optional
ACOUSTID_API_KEY=                    # Optional
RAPIDAPI_KEY=                        # Optional
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

## Troubleshooting

### Backend won't start
- Ensure port 8001 is available
- Check Python version: `python --version`
- Install dependencies: `pip install -r requirements.txt`

### Frontend won't start
- Ensure port 3000 is available
- Clear cache: `rm -rf node_modules package-lock.json && npm install`
- Check Node version: `node --version`

### MongoDB errors
- The app works without MongoDB (uses in-memory fallback)
- To enable MongoDB: ensure `mongod` is running on port 27017
- Or install MongoDB: `brew install mongodb-community` (macOS) or `apt install mongodb` (Linux)

### CORS errors
- Make sure `ALLOWED_ORIGINS` in backend/.env includes your frontend URL
- Default is `http://localhost:3000`

## Development Tips

### Testing Backend API
```bash
# In another terminal
python backend_test.py
```

### Checking Backend Health
```bash
curl http://localhost:8001/api/health
```

### Debug Mode
```bash
# Backend with verbose logging
python server.py --debug

# Frontend with React DevTools
npm start
```

## Next Steps
1. Upload some music files in the "Upload" section
2. Create playlists in "Your Library"
3. Search for tracks and add them to favorites
4. Use keyboard shortcuts to control playback
5. Check out recommendations based on your library

For full documentation, see:
- [Implementation Guide](./IMPLEMENTATION_GUIDE.md)
- [Features Guide](./FEATURES_GUIDE.md)
- [Contract Details](./contracts.md)

Happy listening! 🎧
