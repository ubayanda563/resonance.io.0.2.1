# Frontend-Backend Communication Setup Guide

## Quick Start

### For Local Development

1. **Setup Frontend Environment:**
   ```bash
   cd frontend
   cp .env.local.example .env.local
   # Update .env.local if needed (default is http://localhost:8001)
   ```

2. **Setup Backend Environment:**
   ```bash
   cd backend
   cp .env.example .env
   # Update .env with your API keys and MongoDB URL
   ```

3. **Start Backend (Terminal 1):**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # or `venv\Scripts\activate` on Windows
   pip install -r requirements.txt
   python server.py
   ```
   Backend runs on: http://localhost:8001

4. **Start Frontend (Terminal 2):**
   ```bash
   cd frontend
   npm install
   npm start
   ```
   Frontend runs on: http://localhost:3000

### For Docker

```bash
# Build and start all services
docker-compose up --build

# Services will be available at:
# Frontend: http://localhost:3000
# Backend API: http://localhost:8001
# MongoDB: localhost:27017
```

## API Communication Architecture

### Environment Variables

- **Frontend**: `REACT_APP_BACKEND_URL`
  - Local dev: `http://localhost:8001`
  - Docker: `http://resonance-backend:8001` (set in docker-compose.yml)
  - Must be set at **build time** (in Dockerfile ARG)

- **Backend**: 
  - `MONGO_URL`: MongoDB connection string
  - `ALLOWED_ORIGINS`: CORS whitelist (frontend URL)
  - `DB_NAME`: Database name (default: resonance)

### API Routes

All backend routes are prefixed with `/api`:

- **Tracks**: `/api/tracks`
- **YouTube**: `/api/youtube`
- **Playlists**: `/api/playlists`
- **Favorites**: `/api/favorites`
- **Enrichment**: `/api/enrichment`
- **Recommendations**: `/api/recommendations`
- **Search**: `/api/search`
- **Health Check**: `/api/health`

### Frontend API Clients

Located in `frontend/src/services/`:

1. **api.js** - Main API client for tracks, playlists, YouTube, etc.
   - Uses axios with per-request timeouts
   - Implements abort controllers for cancellation
   
2. **enrichmentAPI.js** - Enrichment endpoints (artist, lyrics, charts)
   - Separate client for metadata operations

### Error Handling

The `handleApiError` function in `api.js` provides standardized error handling:
- Network errors → "Network error — check your connection"
- API errors → Returns error detail from backend
- Unexpected errors → Generic message

## Troubleshooting

### Frontend Can't Connect to Backend

1. Check `REACT_APP_BACKEND_URL` is set correctly:
   ```bash
   # Local dev
   REACT_APP_BACKEND_URL=http://localhost:8001
   
   # Docker
   REACT_APP_BACKEND_URL=http://resonance-backend:8001
   ```

2. Verify backend is running:
   ```bash
   curl http://localhost:8001/api/health
   # Should return: {"status": "ok"}
   ```

3. Check CORS settings in backend:
   - `ALLOWED_ORIGINS` should include frontend URL
   - For Docker: `http://localhost:3000,http://host.docker.internal:3000`

### MongoDB Connection Issues

1. Verify MongoDB is running and credentials are correct
2. Check `MONGO_URL` in backend `.env`
3. For Docker, ensure MongoDB service is healthy

### React Build Issues

If `REACT_APP_BACKEND_URL` is undefined in the frontend:
1. Ensure `.env.local` exists and has the variable
2. Rebuild the frontend: `npm run build`
3. Restart `npm start`

## Development Workflow

1. Make changes to backend routes → Restart backend server
2. Make changes to frontend API calls → Changes reflect on next page refresh
3. For Docker: Changes to source are hot-reloaded via volumes
4. Check browser console for frontend errors
5. Check backend logs for API errors

## Verification Checklist

- [ ] Backend `.env` configured with MongoDB URL and API keys
- [ ] Frontend `.env.local` configured with backend URL
- [ ] Backend service running on port 8001
- [ ] Frontend service running on port 3000
- [ ] Browser console shows no CORS errors
- [ ] API health check responds: `GET /api/health` → `{"status": "ok"}`
- [ ] Frontend can fetch data: Check Network tab in DevTools
