# 🎵 Resonance Music Player - Documentation Index

## 📖 START HERE

**New to Resonance?** → [GETTING_STARTED.md](GETTING_STARTED.md)

This is the most important file. It contains everything you need to know, all in one place.

---

## 🚀 Installation & Setup

1. **[GETTING_STARTED.md](GETTING_STARTED.md)** - Complete beginner guide
   - System requirements
   - 3 different installation methods
   - Configuration
   - Verification steps

2. **[QUICK_START.md](QUICK_START.md)** - Quick reference
   - Condensed setup instructions
   - Feature overview
   - Troubleshooting links

3. **Setup Scripts** - Automated installation
   - `setup.sh` - For macOS/Linux
   - `setup.bat` - For Windows
   - `start.sh` - Launcher script

---

## 🛠️ For Developers

**[DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)** - Complete development documentation
- Project structure overview
- How to run locally
- How to run with Docker
- Adding new API endpoints
- Adding new components
- Testing procedures
- Configuration options
- Architecture decisions
- Performance tips
- Deployment instructions

---

## 🐛 Troubleshooting

**[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Solutions for common issues
- Backend won't start
- Frontend won't start
- CORS errors
- Port conflicts
- Module/dependency issues
- Database errors
- Upload failures
- Keyboard shortcuts not working
- Full reset procedure
- Quick diagnostic checklist

---

## ✅ Status & Reference

1. **[SETUP_COMPLETE.md](SETUP_COMPLETE.md)** - Setup summary
   - What's been configured
   - Files created
   - Quick start reminder
   - Feature checklist

2. **[REFERENCE_CARD.txt](REFERENCE_CARD.txt)** - Printable quick reference
   - Essential commands
   - Keyboard shortcuts
   - Ports and URLs
   - Common issues
   - API endpoints

---

## 📚 Feature Documentation

- **[FEATURES_GUIDE.md](FEATURES_GUIDE.md)** - Detailed feature explanations
  - All features with screenshots
  - How to use each feature
  - Tips and tricks
  - Keyboard shortcuts
  - Keyboard combinations

- **[IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)** - What was built
  - Backend implementation details
  - Frontend implementation details
  - File structure
  - Testing procedures

---

## 📋 Other Files

- **[README.md](README.md)** - Project overview
- **[contracts.md](contracts.md)** - Technical specifications
- **[FEATURE_GUIDE.md](FEATURES_GUIDE.md)** - Full feature documentation
- **[IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)** - What was implemented

---

## 🔧 Tools & Scripts

| Tool | Purpose | Run With |
|------|---------|----------|
| `setup.sh` | Automated setup (macOS/Linux) | `bash setup.sh` |
| `setup.bat` | Automated setup (Windows) | `setup.bat` |
| `start.sh` | Start launcher | `bash start.sh` |
| `healthcheck.py` | System health verification | `python healthcheck.py` |
| `docker-compose.yml` | Container orchestration | `docker-compose up` |

---

## ⚡ Quick Commands

```bash
# Setup
bash setup.sh              # or setup.bat on Windows

# Start services
cd backend && source venv/bin/activate && python server.py
cd frontend && npm start

# Verify everything
python healthcheck.py

# Docker
docker-compose up --build
docker-compose down

# Tests
cd backend && python -m pytest
cd backend && python backend_test.py
```

---

## 🌐 Service URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **API Docs**: http://localhost:8001/docs
- **API Health**: http://localhost:8001/api/health
- **MongoDB** (optional): localhost:27017

---

## 📁 Project Structure

```
resonance.io/
├── backend/                  # FastAPI server
│   ├── server.py            # Main entry point
│   ├── routes/              # API endpoints
│   ├── services/            # External integrations
│   ├── database.py          # Database layer
│   ├── models.py            # Data models
│   └── requirements.txt
│
├── frontend/                 # React app
│   ├── src/
│   │   ├── App.js
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── services/
│   │   └── views/
│   ├── public/
│   └── package.json
│
├── Documentation/
│   ├── GETTING_STARTED.md    ← START HERE
│   ├── QUICK_START.md
│   ├── TROUBLESHOOTING.md
│   ├── DEVELOPER_GUIDE.md
│   ├── FEATURES_GUIDE.md
│   ├── SETUP_COMPLETE.md
│   └── REFERENCE_CARD.txt
│
├── Setup/
│   ├── setup.sh
│   ├── setup.bat
│   ├── start.sh
│   ├── docker-compose.yml
│   └── Dockerfile.*
│
└── Tools/
    ├── healthcheck.py
    └── backend_test.py
```

---

## ❓ Which Document Should I Read?

| Goal | Read |
|------|------|
| I'm new, just want to run it | [GETTING_STARTED.md](GETTING_STARTED.md) |
| Quick setup reminder | [QUICK_START.md](QUICK_START.md) |
| Something's broken | [TROUBLESHOOTING.md](TROUBLESHOOTING.md) |
| I want to develop features | [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) |
| What features exist? | [FEATURES_GUIDE.md](FEATURES_GUIDE.md) |
| What was built? | [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) |
| Need a reference? | [REFERENCE_CARD.txt](REFERENCE_CARD.txt) |
| I'm stuck | [TROUBLESHOOTING.md](TROUBLESHOOTING.md) then `python healthcheck.py` |

---

## ✨ Key Features

✅ Upload & play audio files (MP3, FLAC, WAV, OGG, AAC)
✅ Create and manage playlists
✅ Mark favorite tracks
✅ Search your library
✅ YouTube integration
✅ AI-powered recommendations
✅ Keyboard shortcuts (Space, →/←, S, R, ?)
✅ Offline playback (with in-memory database)
✅ Responsive web design
✅ Works in any modern browser

---

## 🎯 Getting Help

### Step 1: Run the health check
```bash
python healthcheck.py
```

### Step 2: Check relevant documentation
- For setup issues: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- For development: [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)
- For features: [FEATURES_GUIDE.md](FEATURES_GUIDE.md)
- For anything else: [GETTING_STARTED.md](GETTING_STARTED.md)

### Step 3: Check error messages
- Look in terminal where backend/frontend is running
- Open browser console with F12 and check for red errors

### Step 4: Review the docs
Most issues are covered in the troubleshooting guide or can be solved with a full reset using `setup.sh`/`setup.bat`.

---

## 🎉 You're All Set!

Everything is configured and ready. Just follow [GETTING_STARTED.md](GETTING_STARTED.md) to run the app!

**Happy listening!** 🎧

---

**Navigation:**
- [←  Back to Project Root](../)
- [GETTING_STARTED.md →](GETTING_STARTED.md) (Start here!)
