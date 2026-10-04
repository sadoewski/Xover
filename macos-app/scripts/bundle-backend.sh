#!/bin/bash
set -e

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
MACOS_APP_DIR="$PROJECT_ROOT/macos-app/Xover"
RESOURCES_DIR="$MACOS_APP_DIR/Resources"
NODE_VERSION="20.18.0"
NODE_ARCH="arm64"

echo "🔧 Bundling backend for macOS app..."
echo "Project root: $PROJECT_ROOT"

# Clean previous bundle
echo "🧹 Cleaning previous bundle..."
rm -rf "$RESOURCES_DIR/backend"
rm -rf "$RESOURCES_DIR/frontend"
rm -f "$RESOURCES_DIR/node"

# Create directories
mkdir -p "$RESOURCES_DIR/backend"
mkdir -p "$RESOURCES_DIR/frontend"

# Step 1: Install backend dependencies (production only)
echo "📦 Installing backend dependencies..."
cd "$BACKEND_DIR"
if [ ! -f "package.json" ]; then
    echo "❌ Error: backend/package.json not found"
    exit 1
fi

npm install --production --silent
if [ $? -ne 0 ]; then
    echo "❌ Error: npm install failed"
    exit 1
fi

# Step 2: Download Node.js binary
echo "⬇️  Downloading Node.js $NODE_VERSION for $NODE_ARCH..."
NODE_BINARY_DIR="/tmp/node-v$NODE_VERSION-darwin-$NODE_ARCH"
NODE_TARBALL="node-v$NODE_VERSION-darwin-$NODE_ARCH.tar.gz"

if [ ! -f "$RESOURCES_DIR/node" ]; then
    if [ ! -d "$NODE_BINARY_DIR" ]; then
        cd /tmp
        if [ ! -f "$NODE_TARBALL" ]; then
            curl -fsSL "https://nodejs.org/dist/v$NODE_VERSION/$NODE_TARBALL" -o "$NODE_TARBALL"
            if [ $? -ne 0 ]; then
                echo "❌ Error: Failed to download Node.js"
                exit 1
            fi
        fi
        tar -xzf "$NODE_TARBALL"
    fi
    
    cp "$NODE_BINARY_DIR/bin/node" "$RESOURCES_DIR/node"
    chmod +x "$RESOURCES_DIR/node"
    echo "✅ Node.js binary copied"
else
    echo "✅ Node.js binary already exists"
fi

# Step 3: Copy backend files
echo "📋 Copying backend files..."
rsync -a --exclude='node_modules/.cache' \
         --exclude='*.log' \
         --exclude='.env' \
         --exclude='data/' \
         --exclude='tests/' \
         "$BACKEND_DIR/" "$RESOURCES_DIR/backend/"

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to copy backend files"
    exit 1
fi

echo "✅ Backend bundled successfully"

# Step 4: Build frontend
echo "🏗️  Building frontend..."
cd "$FRONTEND_DIR"
if [ ! -f "package.json" ]; then
    echo "❌ Error: frontend/package.json not found"
    exit 1
fi

npm install --silent
if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to install frontend dependencies"
    exit 1
fi

npm run build
if [ $? -ne 0 ]; then
    echo "❌ Error: Frontend build failed"
    exit 1
fi

# Step 5: Copy frontend dist
echo "📋 Copying frontend build..."
if [ ! -d "dist" ]; then
    echo "❌ Error: frontend/dist not found after build"
    exit 1
fi

cp -r dist/* "$RESOURCES_DIR/frontend/"
if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to copy frontend files"
    exit 1
fi

echo "✅ Frontend bundled successfully"

# Verify bundle
echo ""
echo "📊 Bundle summary:"
echo "   Backend: $(du -sh "$RESOURCES_DIR/backend" | cut -f1)"
echo "   Frontend: $(du -sh "$RESOURCES_DIR/frontend" | cut -f1)"
echo "   Node binary: $(du -sh "$RESOURCES_DIR/node" | cut -f1)"
echo ""
echo "✅ Bundle complete!"
