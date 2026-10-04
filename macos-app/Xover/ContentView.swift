//
//  ContentView.swift
//  Xover
//
//  Main window with embedded WKWebView
//

import SwiftUI
import WebKit

struct ContentView: View {
    @EnvironmentObject var appState: AppState
    @ObservedObject var syncManager = SyncManager.shared
    @State private var isLoading = true
    @State private var loadError: String?
    @State private var canGoBack = false
    @State private var canGoForward = false
    
    var body: some View {
        VStack(spacing: 0) {
            // Status Bar
            statusBar
            
            // Web View
            WebViewContainer(
                url: appState.serverURL,
                isLoading: $isLoading,
                loadError: $loadError,
                canGoBack: $canGoBack,
                canGoForward: $canGoForward
            )
            
            // Loading Overlay
            if isLoading && loadError == nil {
                loadingOverlay
            }
            
            // Error View
            if let error = loadError {
                errorView(error)
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .backendStarting)) { _ in
            appState.serverStatus = .starting
        }
        .onReceive(NotificationCenter.default.publisher(for: .backendRunning)) { _ in
            appState.serverStatus = .running
            // Reload web view when backend becomes available
            if loadError != nil {
                loadError = nil
                NotificationCenter.default.post(name: .reloadWebView, object: nil)
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .backendStopped)) { _ in
            appState.serverStatus = .stopped
        }
        .onReceive(NotificationCenter.default.publisher(for: .backendError)) { notification in
            if let error = notification.userInfo?["error"] as? String {
                appState.serverStatus = .error(error)
            }
        }
    }
    
    // MARK: - Status Bar
    
    private var statusBar: some View {
        HStack(spacing: 12) {
            // Server Status Indicator
            HStack(spacing: 6) {
                Image(systemName: appState.serverStatus.icon)
                    .foregroundColor(appState.serverStatus.color)
                    .imageScale(.small)
                
                Text(appState.serverStatus.description)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(.secondary)
            }
            
            Divider()
                .frame(height: 12)
            
            // Server URL
            Text(appState.serverURL)
                .font(.system(size: 11, design: .monospaced))
                .foregroundColor(.secondary)
            
            Spacer()

            // Mode Indicator
            HStack(spacing: 6) {
                Circle()
                    .fill(modeIndicatorColor)
                    .frame(width: 8, height: 8)

                Text(modeIndicatorText)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(.secondary)
            }

            Divider()
                .frame(height: 12)

            // Navigation Controls
            HStack(spacing: 8) {
                Button(action: { NotificationCenter.default.post(name: .webViewGoBack, object: nil) }) {
                    Image(systemName: "chevron.left")
                        .imageScale(.small)
                }
                .disabled(!canGoBack)
                .keyboardShortcut("[", modifiers: .command)
                
                Button(action: { NotificationCenter.default.post(name: .webViewGoForward, object: nil) }) {
                    Image(systemName: "chevron.right")
                        .imageScale(.small)
                }
                .disabled(!canGoForward)
                .keyboardShortcut("]", modifiers: .command)
                
                Divider()
                    .frame(height: 12)
                
                Button(action: { NotificationCenter.default.post(name: .reloadWebView, object: nil) }) {
                    Image(systemName: "arrow.clockwise")
                        .imageScale(.small)
                }
                .keyboardShortcut("r", modifiers: .command)
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Color(NSColor.controlBackgroundColor))
    }
    
    // MARK: - Loading Overlay
    
    private var loadingOverlay: some View {
        ZStack {
            Color(NSColor.windowBackgroundColor)
            
            VStack(spacing: 16) {
                ProgressView()
                    .scaleEffect(1.2)
                
                Text("Loading Hostprint...")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(.secondary)
                
                Text(appState.serverURL)
                    .font(.system(size: 11, design: .monospaced))
                    .foregroundColor(.secondary)
            }
        }
    }
    
    // MARK: - Mode Indicator

    private var modeIndicatorColor: Color {
        if syncManager.standaloneMode {
            return Color.orange
        } else if syncManager.isOnline {
            return Color.green
        } else {
            return Color.red
        }
    }

    private var modeIndicatorText: String {
        if syncManager.standaloneMode {
            return "Local Mode"
        } else if syncManager.isOnline {
            return "Hybrid Mode"
        } else {
            return "Offline"
        }
    }

    // MARK: - Error View

    private func errorView(_ error: String) -> some View {
        ZStack {
            Color(NSColor.windowBackgroundColor)
            
            VStack(spacing: 20) {
                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.system(size: 48))
                    .foregroundColor(.orange)
                
                VStack(spacing: 8) {
                    Text("Cannot Connect to Backend")
                        .font(.system(size: 16, weight: .semibold))
                    
                    Text(error)
                        .font(.system(size: 12))
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                
                VStack(spacing: 12) {
                    Button("Retry Connection") {
                        loadError = nil
                        NotificationCenter.default.post(name: .reloadWebView, object: nil)
                    }
                    .keyboardShortcut(.defaultAction)
                    
                    Button("Restart Backend") {
                        loadError = nil
                        NotificationCenter.default.post(name: .restartBackend, object: nil)
                    }
                    
                    Button("Open Preferences") {
                        NSApp.sendAction(Selector(("showSettingsWindow:")), to: nil, from: nil)
                    }
                }
                .buttonStyle(.borderedProminent)
            }
            .frame(maxWidth: 400)
            .padding(32)
        }
    }
}

// MARK: - WebView Container

struct WebViewContainer: NSViewRepresentable {
    let url: String
    @Binding var isLoading: Bool
    @Binding var loadError: String?
    @Binding var canGoBack: Bool
    @Binding var canGoForward: Bool
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    func makeNSView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        config.preferences.setValue(true, forKey: "developerExtrasEnabled")
        
        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        
        // Load initial URL
        if let url = URL(string: url) {
            webView.load(URLRequest(url: url))
        }
        
        // Setup notification observers
        context.coordinator.setupNotifications(webView: webView)
        
        return webView
    }
    
    func updateNSView(_ webView: WKWebView, context: Context) {
        // Update navigation state
        canGoBack = webView.canGoBack
        canGoForward = webView.canGoForward
    }
    
    // MARK: - Coordinator
    
    class Coordinator: NSObject, WKNavigationDelegate {
        var parent: WebViewContainer
        private var observers: [NSObjectProtocol] = []
        
        init(_ parent: WebViewContainer) {
            self.parent = parent
        }
        
        deinit {
            observers.forEach { NotificationCenter.default.removeObserver($0) }
        }
        
        func setupNotifications(webView: WKWebView) {
            let reloadObserver = NotificationCenter.default.addObserver(
                forName: .reloadWebView,
                object: nil,
                queue: .main
            ) { _ in
                webView.reload()
            }
            
            let backObserver = NotificationCenter.default.addObserver(
                forName: .webViewGoBack,
                object: nil,
                queue: .main
            ) { _ in
                webView.goBack()
            }
            
            let forwardObserver = NotificationCenter.default.addObserver(
                forName: .webViewGoForward,
                object: nil,
                queue: .main
            ) { _ in
                webView.goForward()
            }
            
            let restartObserver = NotificationCenter.default.addObserver(
                forName: .restartBackend,
                object: nil,
                queue: .main
            ) { _ in
                if let appDelegate = NSApp.delegate as? AppDelegate {
                    appDelegate.restartBackend()
                }
            }
            
            observers = [reloadObserver, backObserver, forwardObserver, restartObserver]
        }
        
        // MARK: - WKNavigationDelegate
        
        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            parent.isLoading = true
            parent.loadError = nil
        }
        
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            parent.isLoading = false
            parent.canGoBack = webView.canGoBack
            parent.canGoForward = webView.canGoForward
        }
        
        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            parent.isLoading = false
            parent.loadError = error.localizedDescription
        }
        
        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            parent.isLoading = false
            
            let nsError = error as NSError
            // Ignore cancelled errors (user navigation)
            if nsError.domain == NSURLErrorDomain && nsError.code == NSURLErrorCancelled {
                return
            }
            
            parent.loadError = "Cannot connect to \(parent.url)\n\nMake sure the backend server is running."
        }
    }
}

// MARK: - Notification Names

extension Notification.Name {
    static let reloadWebView = Notification.Name("reloadWebView")
    static let webViewGoBack = Notification.Name("webViewGoBack")
    static let webViewGoForward = Notification.Name("webViewGoForward")
    static let restartBackend = Notification.Name("restartBackend")
    // Backend status notifications are declared in BackendManager.swift
}
