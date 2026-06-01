# 🎵 Resonance - Developer Guide

## Project Structure

```
resonance.io/
├── backend/                    # FastAPI server
│   ├── server.py              # Main app entry point
│   ├── database.py            # MongoDB/in-memory DB
│   ├── models.py              # Pydantic models
│   ├── routes/                # API endpoints
│   │   ├── tracks.py          # Track management
│   │   ├── playlists.py       # Playlist management
│   │   ├── favorites.py       # Favorites system
│   │   ├── recommendations.py # AI recommendations
│   │   ├── search.py          # Search functionality
│   │   ├── youtube.py         # YouTube integration
│   │   ├── artwork.py         # Album artwork
│   │   └── enrichment.py      # Metadata enrichment
│   ├── services/              # External service integrations
│   │   ├── youtube_service.py
│   │   ├── musicbrainz_service.py
│   │   ├── deezer_service.py
│   │   ├── lastfm_service.py
│   │   ├── acoustid_service.py
│   │   └── ...
│   └── requirements.txt
│
├── frontend/                   # React app
│   ├── src/
│   │   ├── App.js             # Main component
│   │   ├── components/        # React components
│   │   ├── contexts/          # Context providers
│   │   ├── hooks/             # Custom hooks
│   │   ├── services/          # API clients
│   │   ├── lib/               # Utilities
│   │   └── views/             # Page views
│   ├── public/
│   ├── package.json
│   └── tailwind.config.js
│
├── setup.sh / setup.bat       # Automated setup
├── start.sh                   # Start script
├── healthcheck.py             # Health check tool
├── docker-compose.yml         # Docker configuration
└── README.md
```

## Running Locally

### 1. One-Time Setup
```bash
# From project root
bash setup.sh  # macOS/Linux
# or
setup.bat     # Windows
```

### 2. Start Services

**Backend (Terminal 1):**
```bash
cd backend
source venv/bin/activate
python server.py
```

**Frontend (Terminal 2):**
```bash
cd frontend
npm start
```

Visit: `http://localhost:3000`

## Running with Docker

### Prerequisites
- Docker & Docker Compose installed
- Port 3000, 8001, 27017 available

### Start
```bash
docker-compose up --build
```

Visit: `http://localhost:3000`

### Stop
```bash
docker-compose down
```

### View logs
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

## Development Workflow

### Adding a New API Endpoint

1. **Create route in `backend/routes/`:**
```python
# backend/routes/my_feature.py
from fastapi import APIRouter

router = APIRouter(prefix="/my-feature", tags=["my-feature"])

@router.get("/")
async def get_my_feature():
    return {"data": "example"}
```

2. **Register in `backend/server.py`:**
```python
from routes import my_feature

api_router.include_router(my_feature.router)
```

3. **Use in frontend `frontend/src/services/api.js`:**
```javascript
export const myFeatureAPI = {
  getData: () =>
    makeRequest(metaClient, { 
      method: 'get', 
      url: '/my-feature' 
    }),
};
```

4. **Test the endpoint:**
```bash
curl http://localhost:8001/api/my-feature
```

### Adding a New Frontend Component

1. **Create component in `frontend/src/components/`:**
```jsx
// frontend/src/components/MyComponent.jsx
import React from 'react';

export function MyComponent() {
  return <div>My Component</div>;
}

export default MyComponent;
```

2. **Use in another component:**
```jsx
import MyComponent from './MyComponent';

function ParentComponent() {
  return <MyComponent />;
}
```

### Testing

**Run backend tests:**
```bash
cd backend
python -m pytest
# or
python backend_test.py
```

**Run frontend tests:**
```bash
cd frontend
npm test
```

**Health check:**
```bash
python healthcheck.py
```

## Configuration

### Backend Environment Variables
```bash
# backend/.env
MONGO_URL=mongodb://localhost:27017  # Optional
DB_NAME=resonance
ALLOWED_ORIGINS=http://localhost:3000
LASTFM_API_KEY=your_key_here
ACOUSTID_API_KEY=your_key_here
RAPIDAPI_KEY=your_key_here
```

### Frontend Environment Variables
```bash
# frontend/.env
REACT_APP_BACKEND_URL=http://localhost:8001
REACT_APP_DEBUG=false
```

## Common Development Tasks

### Debug Backend
```bash
# Add breakpoint in code with:
import pdb; pdb.set_trace()

# Then run server in foreground
python server.py
```

### Hot Reload Frontend
Frontend already has hot reload enabled. Just edit files and save - changes appear instantly.

### Format Code

**Backend:**
```bash
cd backend
black .
isort .
flake8 .
```

**Frontend:**
```bash
cd frontend
npm run lint
# Fix issues
npm run lint -- --fix
```

### Database Management

**Check what's in database:**
```bash
# If using MongoDB:
mongosh mongodb://localhost:27017/resonance

# Queries:
db.tracks.find()
db.playlists.find()
db.favorites.find()

# Clear all:
db.tracks.deleteMany({})
db.playlists.deleteMany({})
```

## Performance Tips

### Backend
- Enable query caching for frequently accessed data
- Use indexes for search queries (already configured)
- Batch process large uploads
- Enable gzip compression in FastAPI

### Frontend
- Use React DevTools to check for unnecessary re-renders
- Lazy load components
- Use memoization for expensive calculations
- Optimize images

## Deployment

### To Production

**Docker:**
```bash
# Build image
docker build -f Dockerfile.backend -t resonance-backend:latest .

# Deploy to cloud (AWS, Google Cloud, etc.)
# Follow your cloud provider's deployment guide
```

**Manual:**
```bash
# Backend
pip install -r backend/requirements.txt
gunicorn server:app --workers 4

# Frontend
npm run build
# Deploy build/ folder to CDN or static host
```

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues.

### Debug Mode
```python
# backend/server.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Architecture Decisions

### Why FastAPI?
- Type-safe with Pydantic
- Built-in async support
- Auto-generated API documentation
- Fast performance

### Why React?
- Component-based architecture
- Large ecosystem (Radix UI, React Router, etc.)
- Easy state management with Context
- Great developer tools

### Why MongoDB Optional?
- Works offline with in-memory database
- No setup required for basic testing
- Production deployments can use MongoDB for persistence

### Why Motor (async driver)?
- Non-blocking database operations
- Better performance for concurrent requests
- Seamless integration with FastAPI async

## Resources

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [React Docs](https://react.dev/)
- [MongoDB Motor](https://motor.readthedocs.io/)
- [Pydantic](https://docs.pydantic.dev/)
- [Radix UI](https://www.radix-ui.com/)

## Getting Help

1. Check existing GitHub issues
2. Review logs with `healthcheck.py`
3. See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
4. Check [QUICK_START.md](./QUICK_START.md)

Happy coding! 🎵
