#!/usr/bin/env bash
# 🎵 Start Resonance - Complete Development Environment

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🎵 Starting Resonance Music Player${NC}"
echo "===================================="
echo ""

# Check if running from correct directory
if [ ! -f "setup.sh" ]; then
    echo "Please run this script from the root directory (where setup.sh is located)"
    exit 1
fi

# Ask user which mode to run
echo "Choose how to start Resonance:"
echo "1) Development (separate terminals)"
echo "2) Docker (all-in-one)"
echo ""
read -p "Enter choice (1 or 2): " choice

if [ "$choice" = "2" ]; then
    # Docker mode
    echo ""
    echo -e "${YELLOW}Starting with Docker...${NC}"
    echo ""
    
    if ! command -v docker &> /dev/null; then
        echo "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    echo "Building and starting containers..."
    docker-compose up --build
    
else
    # Development mode
    echo ""
    echo -e "${YELLOW}Starting in development mode${NC}"
    echo ""
    echo "Opening 2 terminals. Follow these steps:"
    echo ""
    echo -e "${BLUE}Terminal 1 - Backend:${NC}"
    echo "  cd backend"
    echo "  source venv/bin/activate  # (macOS/Linux) or venv\\Scripts\\activate (Windows)"
    echo "  python server.py"
    echo ""
    echo -e "${BLUE}Terminal 2 - Frontend:${NC}"
    echo "  cd frontend"
    echo "  npm start"
    echo ""
    echo -e "${GREEN}Backend: http://localhost:8001${NC}"
    echo -e "${GREEN}Frontend: http://localhost:3000${NC}"
    echo ""
    
    # Ask if user wants to open terminals
    read -p "Would you like to create terminal windows? (y/n): " create_terminals
    
    if [ "$create_terminals" = "y" ] || [ "$create_terminals" = "Y" ]; then
        # macOS
        if [[ "$OSTYPE" == "darwin"* ]]; then
            open -a Terminal
            open -a Terminal
        # Linux
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            gnome-terminal -- bash &
            gnome-terminal -- bash &
        fi
    fi
fi
