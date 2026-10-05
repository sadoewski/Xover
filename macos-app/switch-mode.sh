#!/bin/bash

MODE=${1:-remote}

echo "🔄 Switching Xover to $MODE mode..."
echo ""

case $MODE in
  remote)
    echo "Setting up REMOTE mode (production server)..."
    defaults write com.xover.desktop serverURL "http://179.255.187.191:3000"
    defaults write com.xover.desktop autoStartBackend -bool false
    echo "✓ Server URL: http://179.255.187.191:3000"
    echo "✓ Backend auto-start: disabled"
    echo ""
    echo "⚠️  Make sure to rebuild in Xcode (Cmd+B)"
    ;;

  local)
    echo "Setting up LOCAL mode (development)..."
    defaults write com.xover.desktop serverURL "http://localhost:5173"
    defaults write com.xover.desktop autoStartBackend -bool true
    echo "✓ Server URL: http://localhost:5173"
    echo "✓ Backend auto-start: enabled"
    echo ""
    echo "📦 Starting local services..."

    # Start backend if not running
    if ! lsof -iTCP:5001 -sTCP:LISTEN > /dev/null 2>&1; then
        cd "/Users/sadoewski/projects/hostprint/backend"
        npm run dev > /tmp/xover-backend.log 2>&1 &
        echo "✓ Backend started"
    else
        echo "✓ Backend already running"
    fi

    # Start frontend if not running
    if ! lsof -iTCP:5173 -sTCP:LISTEN > /dev/null 2>&1; then
        cd "/Users/sadoewski/projects/hostprint/frontend"
        npm run dev > /tmp/xover-frontend.log 2>&1 &
        echo "✓ Frontend started"
    else
        echo "✓ Frontend already running"
    fi

    echo ""
    echo "⚠️  Make sure to rebuild in Xcode (Cmd+B)"
    ;;

  *)
    echo "Usage: $0 [remote|local]"
    echo ""
    echo "  remote - Connect to production server (http://179.255.187.191:3000)"
    echo "  local  - Use local development (http://localhost:5173)"
    exit 1
    ;;
esac

echo ""
echo "================================"
echo "✅ Mode switched to: $MODE"
echo "================================"
