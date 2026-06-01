#!/bin/bash
# 🎵 Resonance Music Player - Automated Setup Script
# This script sets up and starts both backend and frontend

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎵 Resonance Music Player Setup${NC}"
echo "=================================="

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js 16+ from https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js ${NODE_VERSION} found${NC}"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed${NC}"
    echo "Please install Python 3.8+ from https://python.org/"
    exit 1
fi
PYTHON_VERSION=$(python3 --version)
echo -e "${GREEN}✓ Python ${PYTHON_VERSION} found${NC}"

# Check npm or yarn
if ! command -v npm &> /dev/null && ! command -v yarn &> /dev/null; then
    echo -e "${RED}❌ npm or yarn is not installed${NC}"
    exit 1
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓ npm ${NPM_VERSION} found${NC}"
    PKG_MGR="npm"
else
    YARN_VERSION=$(yarn -v)
    echo -e "${GREEN}✓ yarn ${YARN_VERSION} found${NC}"
    PKG_MGR="yarn"
fi

# Backend setup
echo -e "\n${BLUE}🔧 Setting up Backend...${NC}"

if [ ! -d "backend" ]; then
    echo -e "${RED}❌ backend directory not found${NC}"
    exit 1
fi

cd backend

# Create venv if it doesn't exist
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating Python virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate venv
source venv/bin/activate

# Install dependencies
echo -e "${YELLOW}Installing Python dependencies...${NC}"
pip install -q -r requirements.txt
echo -e "${GREEN}✓ Python dependencies installed${NC}"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating backend .env file...${NC}"
    cat > .env << 'EOF'
MONGO_URL=
DB_NAME=resonance
ALLOWED_ORIGINS=http://localhost:3000
LASTFM_API_KEY=
ACOUSTID_API_KEY=
RAPIDAPI_KEY=
EOF
    echo -e "${GREEN}✓ Backend .env created (in-memory database will be used)${NC}"
fi

cd ..

# Frontend setup
echo -e "\n${BLUE}🎨 Setting up Frontend...${NC}"

if [ ! -d "frontend" ]; then
    echo -e "${RED}❌ frontend directory not found${NC}"
    exit 1
fi

cd frontend

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating frontend .env file...${NC}"
    echo "REACT_APP_BACKEND_URL=http://localhost:8001" > .env
    echo -e "${GREEN}✓ Frontend .env created${NC}"
fi

# Install dependencies
echo -e "${YELLOW}Installing Node dependencies...${NC}"
$PKG_MGR install --legacy-peer-deps
echo -e "${GREEN}✓ Node dependencies installed${NC}"

cd ..

# Display next steps
echo -e "\n${GREEN}=================================="
echo "✅ Setup Complete!${NC}"
echo -e "${GREEN}==================================${NC}\n"

echo -e "${YELLOW}To start the app:${NC}"
echo ""
echo -e "${BLUE}Terminal 1 - Backend:${NC}"
echo "  cd backend"
echo "  source venv/bin/activate  # (on macOS/Linux)"
echo "  # or venv\\Scripts\\activate  # (on Windows)"
echo "  python server.py"
echo ""
echo -e "${BLUE}Terminal 2 - Frontend:${NC}"
echo "  cd frontend"
echo "  npm start  # or yarn start"
echo ""
echo -e "${YELLOW}The app will open at: http://localhost:3000${NC}"
echo -e "${YELLOW}Backend API runs at: http://localhost:8001${NC}"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo "  - Quick Start: ./QUICK_START.md"
echo "  - Features: ./FEATURES_GUIDE.md"
echo "  - Implementation: ./IMPLEMENTATION_GUIDE.md"
echo ""
