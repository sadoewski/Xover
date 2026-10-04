#!/bin/bash
set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
MACOS_APP_DIR="$PROJECT_ROOT/macos-app"
XCODE_PROJECT="$MACOS_APP_DIR/Xover/Xover.xcodeproj"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛠️  Starting Xover Development Mode${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping development servers...${NC}"
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        echo "   Stopped backend (PID: $BACKEND_PID)"
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        echo "   Stopped frontend (PID: $FRONTEND_PID)"
    fi
    
    echo -e "${GREEN}✅ Cleanup complete${NC}"
    exit 0
}

trap cleanup EXIT INT TERM

# Check dependencies
echo -e "${BLUE}📋 Checking dependencies...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Error: Node.js not found. Please install Node.js${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ Error: npm not found. Please install npm${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dependencies OK${NC}"
echo ""

# Step 1: Install backend dependencies
echo -e "${BLUE}📦 Step 1: Installing backend dependencies...${NC}"
cd "$BACKEND_DIR"
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "   (node_modules exists, skipping)"
fi
echo ""

# Step 2: Install frontend dependencies
echo -e "${BLUE}📦 Step 2: Installing frontend dependencies...${NC}"
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "   (node_modules exists, skipping)"
fi
echo ""

# Step 3: Start backend server
echo -e "${BLUE}🚀 Step 3: Starting backend server...${NC}"
cd "$BACKEND_DIR"

# Check if .env exists, create from example if not
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "   Creating .env from .env.example..."
        cp .env.example .env
    else
        echo -e "${YELLOW}⚠️  Warning: No .env or .env.example found${NC}"
    fi
fi

# Start backend in background
npm run dev > "$SCRIPT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
echo "   Log: $SCRIPT_DIR/backend.log"
echo "   URL: http://localhost:3000"
echo ""

# Wait for backend to be ready
echo "   Waiting for backend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is ready!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Backend failed to start. Check $SCRIPT_DIR/backend.log${NC}"
        exit 1
    fi
    sleep 1
done
echo ""

# Step 4: Start frontend dev server
echo -e "${BLUE}🎨 Step 4: Starting frontend dev server...${NC}"
cd "$FRONTEND_DIR"
npm run dev > "$SCRIPT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"
echo "   Log: $SCRIPT_DIR/frontend.log"
echo "   URL: http://localhost:5173"
echo ""

# Wait for frontend to be ready
echo "   Waiting for frontend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend is ready!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${YELLOW}⚠️  Frontend may not be ready yet. Check $SCRIPT_DIR/frontend.log${NC}"
    fi
    sleep 1
done
echo ""

# Step 5: Open Xcode project
echo -e "${BLUE}🔧 Step 5: Opening Xcode project...${NC}"
if [ ! -d "$XCODE_PROJECT" ]; then
    echo -e "${RED}❌ Error: Xcode project not found at $XCODE_PROJECT${NC}"
    exit 1
fi

open "$XCODE_PROJECT"
echo -e "${GREEN}✅ Xcode opened${NC}"
echo ""

# Development instructions
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Development environment ready!${NC}"
echo ""
echo -e "${BLUE}📍 Services running:${NC}"
echo "   Backend:  http://localhost:3000"
echo "   Frontend: http://localhost:5173"
echo ""
echo -e "${BLUE}📝 Development workflow:${NC}"
echo "   1. Make changes to backend/frontend code"
echo "   2. Changes will auto-reload (hot reload enabled)"
echo "   3. Build and run the app from Xcode (⌘+R)"
echo "   4. The app will connect to local servers"
echo ""
echo -e "${BLUE}📋 Logs:${NC}"
echo "   Backend:  tail -f $SCRIPT_DIR/backend.log"
echo "   Frontend: tail -f $SCRIPT_DIR/frontend.log"
echo ""
echo -e "${BLUE}🛑 To stop:${NC}"
echo "   Press Ctrl+C in this terminal"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers...${NC}"

# Keep script running
while true; do
    sleep 1
    
    # Check if processes are still running
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Backend process died! Check logs.${NC}"
        exit 1
    fi
    
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Frontend process died! Check logs.${NC}"
        exit 1
    fi
done
