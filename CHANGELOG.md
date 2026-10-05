# Changelog - Xover

## [Unreleased] - 2024-10-05

### 🐛 Критическое исправление: DELETE запросы на деплое

#### Fixed
- **Исправлена проблема с удалением элементов на продакшн деплое**
  - DELETE запросы теперь корректно проксируются через Nginx
  - Добавлена обработка OPTIONS preflight запросов для CORS
  - Явное разрешение HTTP методов: GET, POST, PUT, DELETE, PATCH, OPTIONS
  - Правильные CORS заголовки на backend и frontend
  - Увеличены таймауты и размеры буферов для nginx proxy

#### Changed
- **frontend/nginx.conf**:
  - Добавлена обработка OPTIONS запросов
  - Добавлено явное разрешение методов через `proxy_method`
  - Добавлены все необходимые proxy заголовки (X-Real-IP, X-Forwarded-For, etc)
  - Увеличен `client_max_body_size` до 50MB
  - Добавлены таймауты (60s) для долгих запросов
  - Добавлен отдельный location для /uploads
  
- **backend/src/index.js**:
  - Явное указание разрешённых методов в CORS middleware
  - Добавлены `allowedHeaders` и `exposedHeaders`
  - Добавлен `maxAge: 600` для кэширования preflight запросов
  - Добавлено логирование DELETE/PUT/PATCH запросов в dev режиме

#### Added
- **test-delete.sh** - скрипт для тестирования DELETE запросов:
  - Тест OPTIONS preflight запроса
  - Тест DELETE на несуществующий ресурс (404)
  - Тест создания и удаления реального приоритета
  - Проверка CORS заголовков
  - Автоматическая авторизация
  - Цветной вывод результатов
  
- **DELETE_FIX.md** - полная документация по проблеме и решению:
  - Описание проблемы и причин
  - Пошаговая инструкция по применению исправления
  - Инструкции для Docker и обычного деплоя
  - Методы проверки через DevTools и curl
  - Альтернативные решения (POST с _method, X-HTTP-Method-Override)
  - Известные проблемы хостингов (Cloudflare, AWS, shared hosting)
  - Контрольный чеклист
  - Troubleshooting guide

#### Technical Details
Проблема возникала из-за того, что Nginx по умолчанию не проксирует DELETE/PUT/PATCH запросы 
без явного указания разрешённых методов. Кроме того, отсутствовала обработка OPTIONS preflight 
запросов, которые браузер отправляет перед DELETE для проверки CORS политики.

---

### 📱 Mobile Web Adaptation

#### Added
- **Полная мобильная адаптация веб-интерфейса**
  - Responsive design для всех размеров экранов (< 480px, 480-767px, 768-1024px, > 1024px)
  - Мобильное меню с hamburger кнопкой (☰) и полноэкранным overlay
  - Touch-оптимизированные элементы управления (минимум 44x44px для touch-таргетов)
  - Адаптивная навигация с автоматическим скрытием/показом сайдбара
  - Safe area support для устройств с вырезами (iPhone X, 11, 12, 13, 14, 15)
  - Оптимизация для iOS (предотвращение zoom при фокусе, meta-теги для PWA)
  - Поддержка портретной и альбомной ориентации
  - Специальные стили для маленьких экранов (< 480px) и планшетов
- **React hooks для работы с breakpoints**:
  - `useIsMobile()`, `useIsTablet()`, `useIsDesktop()`
  - `useIsSmallMobile()`, `useIsTouchDevice()`, `useIsLandscape()`
  - `useBreakpoints()` - все состояния сразу
- **Адаптивные стили для всех страниц**:
  - Календарь: горизонтальная прокрутка таблиц, компактный toolbar
  - Dashboard: одноколоночный layout, адаптивные карточки статистики
  - Формы авторизации/регистрации: увеличенные поля, полноэкранные на мобильных
  - Модальные окна: fullscreen на мобильных
  - Настройки и все остальные страницы
- **Документация**: `MOBILE_ADAPTATION.md` с полным описанием адаптации

#### Changed
- **Viewport meta tag** обновлен с поддержкой mobile-web-app и viewport-fit
- **Размеры UI элементов**: увеличены для комфортного использования на touch-устройствах
- **Отступы и spacing**: оптимизированы для каждого breakpoint
- **Таблицы**: горизонтальная прокрутка вместо сжатия на мобильных
- **Формы**: font-size 16px для предотвращения zoom на iOS
- **Боковая панель**: выдвижная на мобильных (280px ширина)

#### Technical
- Добавлен `src/styles/mobile.css` с общими мобильными стилями
- Добавлен `src/hooks/useMediaQuery.js` с React hooks для breakpoints
- Обновлены все CSS файлы компонентов и страниц с @media queries
- Touch-оптимизации: `-webkit-tap-highlight-color`, `-webkit-overflow-scrolling`
- Убраны hover эффекты на touch устройствах, добавлены active состояния
- Safe area insets: `env(safe-area-inset-*)` для notched устройств

---

### 🌐 macOS App - Remote Server Support

#### Added
- **App Transport Security (ATS)** configuration for HTTP connections
  - Allowed HTTP to `179.255.187.191` (remote server)
  - Allowed HTTP to `localhost` (local development)
- **Backend mode switching** via `switch-mode.sh`
  - Local mode: launches embedded backend
  - Remote mode: connects to remote server
- **Enhanced error handling** with detailed connection messages
  - Network timeout detection
  - ATS blocking detection
  - Connection refused handling

#### Fixed
- HTTP connection blocking by macOS security
- WKWebView crash from invalid `setValue:forKey:` call
- Navigation error handling improvements

---

### 🎨 Custom App Icon

#### Added
- **AppIcon.icns** (415 KB) with all required sizes:
  - 16×16, 32×32, 128×128, 256×256, 512×512
  - @1x and @2x variants for Retina displays
- **Asset Catalog** (`Assets.xcassets/AppIcon.appiconset/`)
  - Proper Contents.json configuration
  - All PNG sources included
- **Xcode project integration**
  - Added to PBXFileReference
  - Added to PBXBuildFile
  - Added to Resources Build Phase
  - CFBundleIconFile in Info.plist

#### Utilities
- `add_icon.py` - Automated icon integration script
- `check-icon.sh` - Icon setup verification
- `refresh-icon.sh` - Icon cache clearing

---

### 🔧 Developer Experience

#### Added
- **build-and-install.sh** - One-command build and installation
  - Finds built app automatically
  - Verifies ATS settings
  - Installs to /Applications
  - Clears icon cache
- **switch-mode.sh** - Backend configuration utility
  - Quick toggle between local/remote
  - Shows current mode
  - Updates UserDefaults
- **Web Inspector support** - Safari DevTools integration
  - Enabled for macOS 13.3+
  - Console, Network, Elements tabs

#### Improved
- **Logging** with NSLog throughout navigation lifecycle
  - 🌐 Loading URL
  - ✅ Finished loading
  - ❌ Navigation errors with details
  - 🔒 ATS blocking detection
- **Error messages** with actionable information
  - Connection type (timeout, refused, DNS)
  - Suggested fixes
  - Server accessibility check

---

### 📚 Documentation

#### Added
- **DEBUG.md** - Complete debugging guide
  - Step-by-step troubleshooting
  - Console log interpretation
  - Web Inspector usage
  - Common error solutions
- **MODE_SWITCHING.md** - Backend configuration
  - Local vs Remote modes
  - Configuration options
  - Use cases for each mode
- **ICON_SETUP.md** - Icon implementation details
  - Technical specifications
  - Size requirements
  - Troubleshooting guide
- **FINAL_STEPS.md** - Installation instructions
  - Building in Xcode
  - Installation to /Applications
  - Verification steps
- **ICON_FINAL_STEPS.md** - Icon-specific installation
  - Icon integration steps
  - Cache clearing procedures
  - Rollback instructions

---

### 🏗️ Technical Changes

#### Code Changes

**Info.plist**
```xml
+ NSAppTransportSecurity
+   NSAllowsArbitraryLoads: false
+   NSExceptionDomains:
+     179.255.187.191: NSExceptionAllowsInsecureHTTPLoads: true
+     localhost: NSExceptionAllowsInsecureHTTPLoads: true
+ CFBundleIconFile: AppIcon
```

**ContentView.swift**
- Enhanced WKWebView configuration
- Removed invalid `setValue:forKey:` call
- Added timeout and cache control
- Improved navigation delegate methods
- Detailed error categorization

**BackendManager.swift**
- Maintained local backend support
- Compatible with mode switching

**XoverApp.swift**
- Remote mode by default
- UserDefaults integration

---

### 📦 Files Added

```
macos-app/
├── Assets.xcassets/
│   └── AppIcon.appiconset/
│       ├── Contents.json
│       ├── AppIcon-1024.png
│       ├── icon_16x16.png, icon_16x16@2x.png
│       ├── icon_32x32.png, icon_32x32@2x.png
│       ├── icon_128x128.png, icon_128x128@2x.png
│       ├── icon_256x256.png, icon_256x256@2x.png
│       └── icon_512x512.png, icon_512x512@2x.png
├── Xover/
│   └── AppIcon.icns (415 KB)
├── build-and-install.sh
├── switch-mode.sh
├── add_icon.py
├── check-icon.sh
├── refresh-icon.sh
├── add-icon-to-xcode.sh
├── DEBUG.md
├── FINAL_STEPS.md
├── ICON_SETUP.md
├── ICON_FINAL_STEPS.md
└── MODE_SWITCHING.md
```

---

### 🚀 Usage

#### Building and Installing

```bash
# 1. Open Xcode and build
open macos-app/Xover.xcodeproj
# In Xcode: Cmd+Shift+K, Cmd+B

# 2. Install to Applications
cd macos-app
./build-and-install.sh

# 3. Launch
open -a Xover
```

#### Switching Backend Mode

```bash
cd macos-app
./switch-mode.sh remote   # Connect to http://179.255.187.191:3000
./switch-mode.sh local    # Launch embedded backend
./switch-mode.sh status   # Show current mode
```

---

### ✅ Testing

- [x] HTTP connections to remote server work
- [x] Local backend still functional
- [x] App icon appears in Dock
- [x] App icon appears in Cmd+Tab
- [x] App works independently from Xcode
- [x] Web Inspector accessible from Safari
- [x] Mode switching persists across launches
- [x] Error messages are actionable

---

### 🔮 Future Improvements

#### Suggested
1. **HTTPS Support** - Let's Encrypt on server
2. **Offline Mode** - Service Worker + local cache
3. **Auto-reconnect** - Detect connection loss and retry
4. **Better Error UI** - Action buttons in error overlay
5. **System Tray Icon** - Menu bar integration
6. **Auto-updates** - Sparkle framework integration
7. **Crash Reporting** - Sentry or similar
8. **Analytics** - Usage tracking (opt-in)

#### Backend
1. **WebSocket Support** - Real-time updates
2. **API Versioning** - Graceful version mismatches
3. **Health Check Endpoint** - `/health` for monitoring
4. **Rate Limiting** - Protect against abuse

---

### 🐛 Known Issues

None currently! 🎉

---

### 📝 Notes

- App requires macOS 11.0+ (Big Sur)
- Web Inspector requires macOS 13.3+ (Ventura)
- HTTP connections only to whitelisted domains
- Icon cache may require manual refresh (use `refresh-icon.sh`)

---

### 👥 Contributors

- [@sadoewski](https://github.com/sadoewski)

---

### 📄 License

[Your License Here]

---

**Commit**: `b95a4d8`  
**Date**: 2026-10-05  
**Files Changed**: 31 files (+1391, -50)
