# Xover macOS App - Setup Guide

## Files Created

### Core Application Files
- **XoverApp.swift** - Main app entry point with SwiftUI App lifecycle
- **AppDelegate.swift** - Manages embedded Node.js backend lifecycle
- **ContentView.swift** - Main window with WKWebView loading http://localhost:5000
- **WebViewBridge.swift** - Native Swift <-> JavaScript message bridge
- **MenuCommands.swift** - Native macOS menu bar with shortcuts
- **PreferencesView.swift** - Settings window for backend configuration

### Configuration Files
- **Info.plist** - App metadata and permissions
- **Xover.entitlements** - Sandbox entitlements (network, files, JIT for Node.js)
- **README.md** - Complete documentation

## Next Steps

### 1. Create Xcode Project

```bash
cd /Users/sadoewski/projects/hostprint/macos-app
```

Create new Xcode project:
- **Template**: macOS → App
- **Product Name**: Xover
- **Organization**: Hostprint
- **Bundle Identifier**: com.hostprint.xover
- **Interface**: SwiftUI
- **Language**: Swift
- **Minimum Deployment**: macOS 13.0

### 2. Add Source Files

Replace default files with created ones:
1. Delete default `XoverApp.swift` and `ContentView.swift`
2. Add all `.swift` files from `Xover/` directory to project
3. Add `Info.plist` (replace default)
4. Add `Xover.entitlements` to project

### 3. Configure Build Settings

**General Tab:**
- Deployment Target: macOS 13.0
- Bundle Identifier: com.hostprint.xover
- Version: 1.0.0
- Build: 1

**Signing & Capabilities:**
- Enable App Sandbox
- Add Code Signing entitlements: `Xover.entitlements`
- Capabilities needed:
  - Outgoing Connections (Client)
  - Incoming Connections (Server)
  - User Selected Files (Read/Write)

**Build Settings:**
- Swift Language Version: Swift 5
- Enable Hardened Runtime: Yes

### 4. Add App Icon

Create app icon set in `Assets.xcassets/AppIcon.appiconset`:
- 16x16, 32x32, 64x64, 128x128, 256x256, 512x512, 1024x1024
- All @1x and @2x variants

### 5. Embed Backend (for Release builds)

Add build phase to copy backend:

**Build Phases → New Run Script Phase:**

```bash
# Copy backend to Resources
BACKEND_SRC="${PROJECT_DIR}/../../backend"
BACKEND_DEST="${BUILT_PRODUCTS_DIR}/${PRODUCT_NAME}.app/Contents/Resources/backend"

if [ -d "$BACKEND_SRC" ]; then
    echo "Copying backend to app bundle..."
    mkdir -p "$BACKEND_DEST"
    rsync -a --exclude 'node_modules' \
             --exclude 'tests' \
             --exclude '.git' \
             "$BACKEND_SRC/" "$BACKEND_DEST/"
    
    # Install production dependencies
    cd "$BACKEND_DEST"
    npm ci --production --silent
    echo "✓ Backend embedded"
else
    echo "⚠️ Backend not found at $BACKEND_SRC"
fi
```

### 6. Test in Debug Mode

Debug mode loads backend from development directory:
- Backend path: `../../backend` (relative to Xcode)
- Ensure backend is built and dependencies installed
- Backend auto-starts on app launch

**Run backend separately for faster iteration:**
```bash
cd backend
npm start
```

Then disable auto-start in app Preferences.

### 7. Build and Run

1. Select scheme: Xover (My Mac)
2. Press ⌘R to run
3. App should launch and load http://localhost:5000
4. Green status indicator when backend running

## Architecture

```
┌─────────────────────────────────────────┐
│  Xover.app (SwiftUI + WebKit)           │
├─────────────────────────────────────────┤
│  WKWebView                              │
│  └─ Loads: http://localhost:5000       │
├─────────────────────────────────────────┤
│  AppDelegate                            │
│  └─ Manages embedded Node.js process   │
│     └─ Spawns: node backend/src/index.js
│        PORT=5000                        │
├─────────────────────────────────────────┤
│  WebViewBridge                          │
│  └─ window.swift.* JavaScript API      │
└─────────────────────────────────────────┘
           ↓ HTTP ↓
┌─────────────────────────────────────────┐
│  Node.js Backend (Express)              │
│  └─ Port: 5000                          │
│     └─ Serves: Frontend static files    │
│        APIs: /api/*                     │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│  PostgreSQL Database                    │
│  └─ localhost:5432                      │
└─────────────────────────────────────────┘
```

## Key Features

### Native Features
- ✅ Embedded Node.js backend (auto-start/stop)
- ✅ WKWebView with full web app
- ✅ Native menu bar with keyboard shortcuts
- ✅ Swift <-> JS bridge for native APIs
- ✅ Backend status monitoring
- ✅ Preferences window
- ✅ Sandboxed security

### Menu Shortcuts
- **⌘N** - New Task
- **⌘⇧N** - New Data Task
- **⌘R** - Reload
- **⌘[/]** - Back/Forward
- **⌘1-5** - Navigate to sections
- **⌘⇧R** - Restart Backend
- **⌘⌥I** - Web Inspector

### JavaScript Bridge API

```javascript
// Available in web context
window.swift.log('Message');
window.swift.showNotification('Title', 'Body');
window.swift.openExternal('https://...');
window.swift.copyToClipboard('Text');
window.swift.selectFile(['txt', 'pdf'], callback);
window.swift.saveFile('data.json', jsonStr, callback);
window.swift.getSystemInfo(callback);
```

## Troubleshooting

### Backend won't start
- Check Console.app for Node.js errors
- Verify Node.js installed: `which node`
- Check port 5000 not in use: `lsof -i :5000`

### WebView blank
- Check backend status (should be green)
- Open Web Inspector (⌘⌥I) to see console errors
- Try manual backend start in Terminal

### Build errors
- Verify deployment target macOS 13.0+
- Check all .swift files added to target
- Clean build folder: Product → Clean Build Folder

### Sandbox violations
- Check Console.app for sandbox errors
- Verify entitlements in Xover.entitlements
- JIT and unsigned memory needed for Node.js

## Distribution

### Code Signing

```bash
codesign --deep --force --verify --verbose \
  --sign "Developer ID Application: (TEAM)" \
  --entitlements Xover.entitlements \
  Xover.app
```

### Notarization

```bash
# Create ZIP
ditto -c -k --keepParent Xover.app Xover.zip

# Submit to Apple
xcrun notarytool submit Xover.zip \
  --apple-id "email@example.com" \
  --team-id "TEAM_ID" \
  --wait

# Staple ticket
xcrun stapler staple Xover.app
```

### DMG Installer

```bash
# Using create-dmg tool
npm install -g create-dmg

create-dmg Xover.app --overwrite
```

## Production Checklist

- [ ] Backend embedded in app bundle
- [ ] Production dependencies only (npm ci --production)
- [ ] Code signed with Developer ID
- [ ] Notarized with Apple
- [ ] Tested on clean macOS install
- [ ] DMG installer created
- [ ] README updated with version
- [ ] Release notes prepared

## Support

For issues, see main project documentation:
- Backend: `/backend/README.md`
- Frontend: `/frontend/README.md`
- API Docs: `/docs/openapi.yaml`

