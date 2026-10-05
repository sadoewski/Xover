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
    @State private var isLoading = true
    @State private var loadError: String?
    @State private var canGoBack = false
    @State private var canGoForward = false
    
    var body: some View {
        ZStack {
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
            }
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

        // Enable Web Inspector for debugging
        if #available(macOS 13.3, *) {
            webView.isInspectable = true
        }

        // Setup WebView bridge for native integration
        let bridge = WebViewBridge(webView: webView)
        context.coordinator.bridge = bridge

        // Load initial URL
        if let url = URL(string: url) {
            NSLog("🌐 Loading URL: \(url.absoluteString)")
            var request = URLRequest(url: url)
            request.cachePolicy = .reloadIgnoringLocalAndRemoteCacheData
            request.timeoutInterval = 30
            webView.load(request)
        } else {
            NSLog("❌ Invalid URL: \(url)")
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
        var bridge: WebViewBridge?
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

            let navigateObserver = NotificationCenter.default.addObserver(
                forName: .navigateTo,
                object: nil,
                queue: .main
            ) { notification in
                if let path = notification.userInfo?["path"] as? String,
                   let baseURL = webView.url?.scheme.flatMap({ scheme in
                       webView.url?.host.map { host in
                           "\(scheme)://\(host)" + (webView.url?.port.map { ":\($0)" } ?? "")
                       }
                   }),
                   let url = URL(string: baseURL + path) {
                    webView.load(URLRequest(url: url))
                }
            }

            observers = [reloadObserver, backObserver, forwardObserver, restartObserver, navigateObserver]
        }
        
        // MARK: - WKNavigationDelegate

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            NSLog("🔄 Started loading: \(webView.url?.absoluteString ?? "unknown")")
            parent.isLoading = true
            parent.loadError = nil
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            NSLog("✅ Finished loading: \(webView.url?.absoluteString ?? "unknown")")
            parent.isLoading = false
            parent.canGoBack = webView.canGoBack
            parent.canGoForward = webView.canGoForward
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            NSLog("❌ Navigation failed: \(error.localizedDescription)")
            parent.isLoading = false
            parent.loadError = error.localizedDescription
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            parent.isLoading = false

            let nsError = error as NSError
            NSLog("❌ Provisional navigation failed: \(nsError.domain) code=\(nsError.code) - \(error.localizedDescription)")

            // Ignore cancelled errors (user navigation)
            if nsError.domain == NSURLErrorDomain && nsError.code == NSURLErrorCancelled {
                NSLog("⏸️  Navigation cancelled by user")
                return
            }

            // More detailed error messages
            var errorMessage = "Cannot connect to \(parent.url)"

            if nsError.domain == NSURLErrorDomain {
                switch nsError.code {
                case NSURLErrorNotConnectedToInternet:
                    errorMessage += "\n\n❌ No internet connection"
                case NSURLErrorTimedOut:
                    errorMessage += "\n\n⏱️ Connection timed out"
                case NSURLErrorCannotFindHost:
                    errorMessage += "\n\n🔍 Cannot find host"
                case NSURLErrorCannotConnectToHost:
                    errorMessage += "\n\n🚫 Cannot connect to host"
                case NSURLErrorAppTransportSecurityRequiresSecureConnection:
                    errorMessage += "\n\n🔒 App Transport Security blocked the connection\nHTTP connections need to be explicitly allowed"
                default:
                    errorMessage += "\n\n\(error.localizedDescription)"
                }
            } else {
                errorMessage += "\n\n\(error.localizedDescription)"
            }

            errorMessage += "\n\nMake sure the server is running and accessible."

            parent.loadError = errorMessage
        }
    }
}
