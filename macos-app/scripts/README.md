# Xover Build Scripts

Build automation scripts for the Xover macOS application.

## Scripts Overview

### 1. `bundle-backend.sh`
Bundles the Node.js backend and frontend for inclusion in the macOS app.

**What it does:**
- Installs backend dependencies (`npm install --production`)
- Downloads Node.js arm64 binary (v20.18.0)
- Copies backend files to `Xover/Resources/backend/`
- Builds frontend (`npm run build`)
- Copies frontend dist to `Xover/Resources/frontend/`

**Usage:**
```bash
./scripts/bundle-backend.sh
```

**Output:**
- `Xover/Resources/node` - Node.js binary
- `Xover/Resources/backend/` - Backend application
- `Xover/Resources/frontend/` - Frontend build

---

### 2. `build-app.sh`
Complete build pipeline: bundles backend/frontend, builds Xcode project, signs app, and creates DMG installer.

**What it does:**
1. Runs `bundle-backend.sh`
2. Builds Xcode project (Release configuration)
3. Code signs the app (optional, requires Developer ID)
4. Creates DMG installer with Applications symlink

**Usage:**
```bash
# Build without code signing
./scripts/build-app.sh

# Build with code signing
SIGNING_IDENTITY="Developer ID Application: Your Name (TEAM_ID)" ./scripts/build-app.sh
```

**Output:**
- `build/Release/Xover.app` - Built application
- `build/Xover-Installer.dmg` - DMG installer

**Requirements:**
- Xcode Command Line Tools
- Valid Apple Developer ID (for code signing)

---

### 3. `dev.sh`
Development mode with hot reload.

**What it does:**
- Starts backend server (port 3000)
- Starts frontend dev server (port 5173)
- Opens Xcode project
- Monitors processes and provides logs
- Cleans up on exit (Ctrl+C)

**Usage:**
```bash
./scripts/dev.sh
```

**Features:**
- Hot reload for backend and frontend
- Auto-restart on file changes
- Centralized logging
- Health checks
- Graceful cleanup

**Logs:**
- Backend: `scripts/backend.log`
- Frontend: `scripts/frontend.log`

---

## Workflow

### Development
```bash
# Start development environment
./scripts/dev.sh

# Make changes to code
# Changes auto-reload

# Build and run from Xcode (⌘+R)
# App connects to local servers
```

### Production Build
```bash
# Build and create installer
./scripts/build-app.sh

# Output: build/Xover-Installer.dmg
```

### Distribution
```bash
# Build with code signing for distribution
SIGNING_IDENTITY="Developer ID Application: Your Name (TEAM_ID)" ./scripts/build-app.sh

# Notarize (required for distribution outside App Store)
xcrun notarytool submit build/Xover-Installer.dmg \
  --apple-id "your@email.com" \
  --team-id "TEAM_ID" \
  --password "app-specific-password"
```

---

## Configuration

### Node.js Version
Edit `bundle-backend.sh`:
```bash
NODE_VERSION="20.18.0"
NODE_ARCH="arm64"
```

### Code Signing
Set environment variable:
```bash
export SIGNING_IDENTITY="Developer ID Application: Your Name (TEAM_ID)"
```

Or in `.zshrc` / `.bashrc`:
```bash
echo 'export SIGNING_IDENTITY="Developer ID Application: Your Name (TEAM_ID)"' >> ~/.zshrc
```

---

## Troubleshooting

### Bundle script fails
```bash
# Check Node.js is installed
node --version

# Check npm is installed
npm --version

# Clean and retry
rm -rf backend/node_modules frontend/node_modules
./scripts/bundle-backend.sh
```

### Build script fails
```bash
# Check Xcode is installed
xcodebuild -version

# Clean build
rm -rf macos-app/build
./scripts/build-app.sh
```

### Dev script fails
```bash
# Check ports are free
lsof -i :3000
lsof -i :5173

# Kill processes if needed
kill -9 $(lsof -t -i :3000)
kill -9 $(lsof -t -i :5173)

# Check logs
tail -f scripts/backend.log
tail -f scripts/frontend.log
```

### Code signing fails
```bash
# List available identities
security find-identity -v -p codesigning

# Verify certificate
codesign --verify --deep --strict build/Release/Xover.app
```

---

## Requirements

- macOS 12.0 or later
- Xcode 14.0 or later
- Node.js 18.x or later
- npm 9.x or later
- Apple Developer ID (for code signing)

---

## Notes

- All scripts use `set -e` for fail-fast behavior
- Scripts are idempotent (safe to run multiple times)
- Node.js binary is cached in `/tmp/` to speed up rebuilds
- Frontend build is optimized for production (minified, tree-shaken)
- Backend runs in production mode (NODE_ENV=production)
- Code signing is optional but recommended for distribution
