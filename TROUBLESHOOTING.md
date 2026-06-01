# 🎵 Resonance - Troubleshooting Guide

## Common Issues & Solutions

### 🔴 Backend Won't Start

#### Error: "Port 8001 already in use"
```bash
# Find and kill the process using port 8001
# macOS/Linux:
lsof -i :8001
kill -9 <PID>

# Windows:
netstat -ano | findstr :8001
taskkill /PID <PID> /F
```

#### Error: "ModuleNotFoundError: No module named 'fastapi'"
```bash
# Make sure you're in backend directory and venv is activated
cd backend
source venv/bin/activate  # macOS/Linux
# or
venv\Scripts\activate  # Windows

# Then install dependencies
pip install -r requirements.txt
```

#### Error: "No module named 'motor' or 'pymongo'"
```bash
# Reinstall all requirements
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

---

### 🔴 Frontend Won't Start

#### Error: "Port 3000 already in use"
```bash
# macOS/Linux:
lsof -i :3000
kill -9 <PID>

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

#### Error: "npm ERR! missing script: start"
```bash
# Make sure you're in the frontend directory
cd frontend

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Then start
npm start
```

#### Error: "React version conflict" or dependency issues
```bash
cd frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

---

### 🔴 CORS Error ("Access to XMLHttpRequest blocked")

**Cause:** Frontend and backend are not configured to communicate

**Solution 1: Check backend .env**
```bash
cd backend
# Make sure .env has:
# ALLOWED_ORIGINS=http://localhost:3000
```

**Solution 2: Verify frontend .env**
```bash
cd frontend
# Make sure .env has:
# REACT_APP_BACKEND_URL=http://localhost:8001
```

**Solution 3: Restart both servers**
```bash
# Terminal 1: Kill backend (Ctrl+C)
# Terminal 2: Kill frontend (Ctrl+C)
# Then start them again
```

---

### 🔴 "Backend not responding" or "Cannot connect to API"

**Check if backend is actually running:**
```bash
curl http://localhost:8001/api/health
# Should return: {"status":"ok"}
```

**If you get connection refused:**
1. Make sure you've started the backend: `python server.py`
2. Check if port 8001 is accessible: `netstat -an | grep 8001`
3. Try: `python -m uvicorn server:app --host 0.0.0.0 --port 8001`

---

### 🔴 "No such file or directory" when uploading music

**Cause:** Backend uploads directory doesn't exist

**Solution:**
```bash
cd backend
mkdir -p uploads/audio
# Try uploading again
```

---

### 🔴 "Database error" or "Failed to load tracks"

**If using MongoDB:**
1. Check if MongoDB is running: `mongod --version`
2. Start MongoDB: `mongosh` or `brew services start mongodb-community`
3. Verify connection: `mongosh mongodb://localhost:27017`

**If not using MongoDB:**
- The app will automatically use in-memory database
- Data will be lost on backend restart

**Solution: Use in-memory database**
```bash
# Just don't set MONGO_URL in backend/.env
# Leave it empty or delete the line
# Backend will use in-memory storage automatically
```

---

### 🟡 "Hot reload not working" (frontend changes don't appear)

**Solution:** Restart the frontend dev server
```bash
# In terminal with npm start running
# Press Ctrl+C to stop
# Run npm start again
```

---

### 🟡 "Slow uploads" or "Upload hangs"

**Solution:** Check file size
- Max upload size is 50 MB
- Ensure your audio file is valid
- Try a smaller file first

---

### 🟡 "Search not working"

**Check backend search endpoint:**
```bash
curl "http://localhost:8001/api/search?q=test"
# Should return search results
```

**If error:**
1. Make sure you've uploaded some tracks first
2. Check backend logs for errors
3. Verify MongoDB/in-memory database is working

---

### 🟡 "Keyboard shortcuts not working"

**Solution:** Click in the player area first to give it focus
- The app needs focus to capture keyboard events
- Try clicking anywhere in the main content area

---

### ⚫ Everything's broken - Full Reset

```bash
# Stop both servers (Ctrl+C in both terminals)

# Remove all cached files
cd frontend
rm -rf node_modules package-lock.json build .env
npm cache clean --force

cd ../backend
rm -rf venv __pycache__ .pytest_cache
rm -f .env

# Run setup script
cd ..
bash setup.sh  # macOS/Linux
# or
setup.bat  # Windows
```

---

## Quick Diagnostic Checklist

- [ ] Backend running: `curl http://localhost:8001/api/health`
- [ ] Frontend running: Open `http://localhost:3000` in browser
- [ ] Backend .env has `ALLOWED_ORIGINS=http://localhost:3000`
- [ ] Frontend .env has `REACT_APP_BACKEND_URL=http://localhost:8001`
- [ ] No errors in browser console (F12)
- [ ] No errors in backend terminal
- [ ] Uploads directory exists: `backend/uploads/audio/`
- [ ] Node version 16+: `node --version`
- [ ] Python version 3.8+: `python --version`

---

## Getting Help

### Check Log Files

**Backend logs:**
```bash
# Scroll through terminal output while running
# Look for ERROR or Exception messages
```

**Frontend logs:**
```bash
# Open browser DevTools (F12)
# Check Console tab for red errors
# Check Network tab for failed API calls
```

### Run Health Check

```bash
python healthcheck.py
# Shows detailed system health report
```

### Enable Debug Mode

**Backend:**
```bash
# Add to backend/server.py startup
import logging
logging.basicConfig(level=logging.DEBUG)
```

**Frontend:**
```bash
# Add to frontend/.env
REACT_APP_DEBUG=true
```

---

## Performance Tips

### Make uploads faster
- Pre-convert audio to MP3 format
- Limit uploads to 30 MB or less

### Make search faster
- Install and run MongoDB instead of in-memory database
- Add more RAM to system

### Improve UI responsiveness
- Update Node.js to latest LTS version
- Clear browser cache (Ctrl+Shift+Delete)
- Disable browser extensions

---

## Still stuck?

1. Check the [Quick Start Guide](./QUICK_START.md)
2. Review [Implementation Guide](./IMPLEMENTATION_GUIDE.md)
3. Check [Features Guide](./FEATURES_GUIDE.md)
4. Run health check: `python healthcheck.py`
5. Review error messages carefully - they usually point to the issue

**Still need help?** - Check the GitHub issues or create a detailed issue report with:
- Your OS (Windows/macOS/Linux)
- Python version
- Node version
- Full error message from terminal
- Steps to reproduce the issue
