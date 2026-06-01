# 🎵 RESONANCE - COMPLETE GETTING STARTED GUIDE

## ⚡ Quick Start (2 Minutes)

### For Mac/Linux:
```bash
# 1. Run setup
bash setup.sh

# 2. Terminal 1 - Backend
cd backend
source venv/bin/activate
python server.py

# 3. Terminal 2 - Frontend
cd frontend
npm start
```

### For Windows:
```bash
# 1. Run setup
setup.bat

# 2. Terminal 1 - Backend
cd backend
venv\Scripts\activate
python server.py

# 3. Terminal 2 - Frontend
cd frontend
npm start
```

**Done!** Open http://localhost:3000

---

## 📋 System Requirements

- **Node.js**: 16+ ([download](https://nodejs.org/))
- **Python**: 3.8+ ([download](https://python.org/))
- **RAM**: 2GB minimum, 4GB+ recommended
- **Disk**: 500MB free space

**Optional:**
- **Docker**: For containerized setup
- **MongoDB**: For persistent database (app works without it)

---

## 🎯 What Works Out of the Box

✅ **Upload Music** - Add MP3, WAV, FLAC, OGG, AAC files
✅ **Play Music** - Stream from local library or YouTube
✅ **Playlists** - Create and manage playlists
✅ **Favorites** - Mark your favorite tracks
✅ **Search** - Find tracks by title, artist, album
✅ **Recommendations** - Get suggestions based on your library
✅ **Keyboard Shortcuts** - Control playback with hotkeys
✅ **Offline Support** - Basic features work without internet

---

## 🚀 Installation Methods

### Method 1: Automated Setup (Recommended)

```bash
# macOS/Linux
bash setup.sh

# Windows
setup.bat
```

Follow the prompts - it handles everything.

### Method 2: Manual Setup

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # macOS/Linux
# or venv\Scripts\activate  # Windows

pip install -r requirements.txt
python server.py
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

### Method 3: Docker

```bash
# macOS/Linux/Windows
docker-compose up --build
```

Requires Docker & Docker Compose installed.

---

## 🎮 Using the App

### Main Features

**🎵 Library**
- Click "Upload" to add music files
- Drag and drop to upload
- Music appears in library

**▶️ Player**
- Click any track to play
- Use player controls at bottom
- Press Space to play/pause

**📋 Playlists**
- Go to "Your Library"
- Click "New" to create playlist
- Drag tracks to add to playlist

**❤️ Favorites**
- Click heart icon on track
- View in "Favorites" section
- Helps with recommendations

**🔍 Search**
- Click "Search" in sidebar
- Type song, artist, or album name
- Press Enter to search

**⌨️ Keyboard Shortcuts**
- **Space** - Play/Pause
- **→ or N** - Next track
- **← or P** - Previous track  
- **S** - Shuffle
- **R** - Repeat mode
- **?** - Show all shortcuts

---

## 🐛 Verify Everything Works

### Quick Health Check
```bash
python healthcheck.py
```

Should show:
```
✓ Backend: Health Check
✓ Backend: API Root
✓ Backend: Tracks List
✓ Frontend: Connectivity
```

### Manual Testing

**Test Backend:**
```bash
# Health check
curl http://localhost:8001/api/health

# Get tracks
curl http://localhost:8001/api/tracks

# Search
curl "http://localhost:8001/api/search?q=test"
```

**Test Frontend:**
- Open http://localhost:3000
- Should see player interface
- Check browser console (F12) for errors

---

## ⚙️ Configuration

### Backend (.env)

**Location:** `backend/.env`

**Minimal (works as-is):**
```
DB_NAME=resonance
ALLOWED_ORIGINS=http://localhost:3000
```

**With MongoDB:**
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=resonance
ALLOWED_ORIGINS=http://localhost:3000
```

**With API Keys (optional):**
```
LASTFM_API_KEY=your_key
ACOUSTID_API_KEY=your_key
RAPIDAPI_KEY=your_key
```

### Frontend (.env)

**Location:** `frontend/.env`

**Required:**
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

**Optional:**
```
REACT_APP_DEBUG=true
```

---

## 📚 Documentation

- **[QUICK_START.md](./QUICK_START.md)** - Quick reference
- **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)** - For developers
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Fix issues
- **[FEATURES_GUIDE.md](./FEATURES_GUIDE.md)** - All features explained
- **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - What was built

---

## ❓ Common Questions

### Q: Do I need MongoDB?
**A:** No. The app works with an in-memory database. Data persists during a session but is lost on backend restart. Use MongoDB for persistence.

### Q: Can I use this offline?
**A:** Yes, basic features work offline. Some features (YouTube search, external APIs) need internet.

### Q: How do I upload music?
**A:** Click "Upload" button → Select audio file → It appears in library. Max file size: 50MB.

### Q: Can I access from other computers?
**A:** Yes. Change `ALLOWED_ORIGINS` in backend/.env to include other IPs:
```
ALLOWED_ORIGINS=http://localhost:3000,http://192.168.1.100:3000
```

### Q: How do I update the app?
**A:** 
```bash
git pull origin main
bash setup.sh  # Reinstall dependencies if needed
```

### Q: Can I use this on mobile?
**A:** The web app works on mobile browsers. iOS app code is available in `/ios`.

---

## 🔧 Troubleshooting Quick Links

| Issue | Solution |
|-------|----------|
| Port already in use | [TROUBLESHOOTING.md](./TROUBLESHOOTING.md#port-already-in-use) |
| CORS error | [TROUBLESHOOTING.md](./TROUBLESHOOTING.md#cors-error) |
| Backend not responding | [TROUBLESHOOTING.md](./TROUBLESHOOTING.md#backend-not-responding) |
| Upload fails | [TROUBLESHOOTING.md](./TROUBLESHOOTING.md#upload-fails) |
| Search not working | [TROUBLESHOOTING.md](./TROUBLESHOOTING.md#search-not-working) |

---

## 📝 Setup Checklist

Before reporting issues, verify:

- [ ] Python 3.8+ installed: `python --version`
- [ ] Node 16+ installed: `node --version`
- [ ] Backend .env exists with proper config
- [ ] Frontend .env has `REACT_APP_BACKEND_URL=http://localhost:8001`
- [ ] Backend server running: `http://localhost:8001/api/health` returns `{"status":"ok"}`
- [ ] Frontend running: `http://localhost:3000` loads
- [ ] No errors in browser console (F12)
- [ ] No errors in backend terminal
- [ ] Health check passes: `python healthcheck.py`

---

## 🎯 Next Steps

### For Users
1. Upload some music files
2. Create a playlist
3. Try keyboard shortcuts
4. Check out recommendations
5. Explore all features

### For Developers
1. Read [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)
2. Try adding a new feature
3. Run tests with `python backend_test.py`
4. Check code with `npm run lint`

### For Advanced Users
1. Set up MongoDB for persistence
2. Deploy with Docker
3. Connect multiple clients
4. Add custom API keys for enriched metadata

---

## 🆘 Need Help?

1. **Quick check:** `python healthcheck.py`
2. **Read docs:** [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
3. **Check logs:** Look for red text in terminal/console
4. **Try reset:** Follow "Full Reset" in troubleshooting guide
5. **Ask questions:** Create GitHub issue with details

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────┐
│       Browser (React Frontend)          │
│  • Player interface                     │
│  • Playlist management                  │
│  • Search UI                            │
│  • Context state management             │
└──────────────┬──────────────────────────┘
               │ HTTP/REST
               │
       ┌───────▼──────────┐
       │ FastAPI Backend  │
       │ :8001            │
       │ • Track API      │
       │ • Playlist API   │
       │ • Search API     │
       │ • YouTube API    │
       └───────┬──────────┘
               │
       ┌───────▼──────────────────┐
       │   Database Layer         │
       │ • MongoDB (optional)     │
       │ • In-memory fallback     │
       │ • Collections:           │
       │   - tracks               │
       │   - playlists            │
       │   - favorites            │
       │   - search_history       │
       └──────────────────────────┘
```

---

## 🎉 You're Ready!

Everything is set up. Now:

1. **Start Backend**: `cd backend && source venv/bin/activate && python server.py`
2. **Start Frontend**: `cd frontend && npm start`
3. **Open Browser**: http://localhost:3000
4. **Start Creating**: Upload music and enjoy! 🎵

---

**Questions? Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) or review the documentation above.**

**Happy listening!** 🎧
