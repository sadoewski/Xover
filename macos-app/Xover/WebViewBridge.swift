//
//  WebViewBridge.swift
//  Xover
//
//  Swift <-> JavaScript communication bridge
//  Enables native features and message passing between Swift and WebView
//

import WebKit
import Foundation

class WebViewBridge: NSObject, WKScriptMessageHandler {
    weak var webView: WKWebView?
    private var messageHandlers: [String: (Any) -> Void] = [:]
    
    // MARK: - Initialization
    
    init(webView: WKWebView) {
        self.webView = webView
        super.init()
        setupBridge()
    }
    
    private func setupBridge() {
        guard let webView = webView else { return }
        
        let contentController = webView.configuration.userContentController
        
        // Register message handlers
        registerHandler(name: "nativeLog")
        registerHandler(name: "showNotification")
        registerHandler(name: "openExternal")
        registerHandler(name: "getSystemInfo")
        registerHandler(name: "copyToClipboard")
        registerHandler(name: "selectFile")
        registerHandler(name: "saveFile")
        
        // Inject bridge script
        injectBridgeScript()
    }
    
    private func registerHandler(name: String) {
        webView?.configuration.userContentController.add(self, name: name)
    }
    
    // MARK: - Script Injection
    
    private func injectBridgeScript() {
        let bridgeScript = """
        // Swift <-> JS Bridge
        window.swift = {
            // Log to native console
            log: function(message) {
                webkit.messageHandlers.nativeLog.postMessage({ message: String(message) });
            },
            
            // Show native notification
            showNotification: function(title, body) {
                webkit.messageHandlers.showNotification.postMessage({ title, body });
            },
            
            // Open URL in external browser
            openExternal: function(url) {
                webkit.messageHandlers.openExternal.postMessage({ url });
            },
            
            // Get system information
            getSystemInfo: function(callback) {
                window._systemInfoCallback = callback;
                webkit.messageHandlers.getSystemInfo.postMessage({});
            },
            
            // Copy text to clipboard
            copyToClipboard: function(text) {
                webkit.messageHandlers.copyToClipboard.postMessage({ text });
            },
            
            // Select file (returns file path)
            selectFile: function(extensions, callback) {
                window._fileSelectCallback = callback;
                webkit.messageHandlers.selectFile.postMessage({ extensions });
            },
            
            // Save file dialog
            saveFile: function(filename, data, callback) {
                window._fileSaveCallback = callback;
                webkit.messageHandlers.saveFile.postMessage({ filename, data });
            }
        };
        
        // Mark bridge as ready
        window.swiftBridgeReady = true;
        console.log('✓ Swift bridge initialized');
        """
        
        let script = WKUserScript(
            source: bridgeScript,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        )
        
        webView?.configuration.userContentController.addUserScript(script)
    }
    
    // MARK: - WKScriptMessageHandler
    
    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        guard let body = message.body as? [String: Any] else { return }
        
        switch message.name {
        case "nativeLog":
            handleNativeLog(body)
        case "showNotification":
            handleShowNotification(body)
        case "openExternal":
            handleOpenExternal(body)
        case "getSystemInfo":
            handleGetSystemInfo()
        case "copyToClipboard":
            handleCopyToClipboard(body)
        case "selectFile":
            handleSelectFile(body)
        case "saveFile":
            handleSaveFile(body)
        default:
            print("Unknown message handler: \(message.name)")
        }
    }
    
    // MARK: - Message Handlers
    
    private func handleNativeLog(_ body: [String: Any]) {
        if let message = body["message"] as? String {
            print("[WebView Log] \(message)")
        }
    }
    
    private func handleShowNotification(_ body: [String: Any]) {
        guard let title = body["title"] as? String else { return }
        let bodyText = body["body"] as? String ?? ""
        
        let notification = NSUserNotification()
        notification.title = title
        notification.informativeText = bodyText
        notification.soundName = NSUserNotificationDefaultSoundName
        
        NSUserNotificationCenter.default.deliver(notification)
    }
    
    private func handleOpenExternal(_ body: [String: Any]) {
        guard let urlString = body["url"] as? String,
              let url = URL(string: urlString) else { return }
        
        NSWorkspace.shared.open(url)
    }
    
    private func handleGetSystemInfo() {
        let info: [String: Any] = [
            "platform": "macos",
            "version": ProcessInfo.processInfo.operatingSystemVersionString,
            "arch": ProcessInfo.processInfo.machineArchitecture,
            "appVersion": Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0",
            "buildNumber": Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1"
        ]
        
        sendToJS(callback: "_systemInfoCallback", data: info)
    }
    
    private func handleCopyToClipboard(_ body: [String: Any]) {
        guard let text = body["text"] as? String else { return }
        
        let pasteboard = NSPasteboard.general
        pasteboard.clearContents()
        pasteboard.setString(text, forType: .string)
    }
    
    private func handleSelectFile(_ body: [String: Any]) {
        let extensions = body["extensions"] as? [String] ?? []
        
        let panel = NSOpenPanel()
        panel.allowsMultipleSelection = false
        panel.canChooseDirectories = false
        panel.canChooseFiles = true
        
        if !extensions.isEmpty {
            panel.allowedFileTypes = extensions
        }
        
        panel.begin { [weak self] response in
            if response == .OK, let url = panel.url {
                self?.sendToJS(callback: "_fileSelectCallback", data: [
                    "path": url.path,
                    "filename": url.lastPathComponent
                ])
            } else {
                self?.sendToJS(callback: "_fileSelectCallback", data: NSNull())
            }
        }
    }
    
    private func handleSaveFile(_ body: [String: Any]) {
        guard let filename = body["filename"] as? String,
              let data = body["data"] as? String else {
            sendToJS(callback: "_fileSaveCallback", data: ["success": false])
            return
        }
        
        let panel = NSSavePanel()
        panel.nameFieldStringValue = filename
        
        panel.begin { [weak self] response in
            if response == .OK, let url = panel.url {
                do {
                    try data.write(to: url, atomically: true, encoding: .utf8)
                    self?.sendToJS(callback: "_fileSaveCallback", data: [
                        "success": true,
                        "path": url.path
                    ])
                } catch {
                    self?.sendToJS(callback: "_fileSaveCallback", data: [
                        "success": false,
                        "error": error.localizedDescription
                    ])
                }
            } else {
                self?.sendToJS(callback: "_fileSaveCallback", data: ["success": false])
            }
        }
    }
    
    // MARK: - Send to JavaScript
    
    private func sendToJS(callback: String, data: Any) {
        guard let webView = webView else { return }
        
        let jsonData: Data
        do {
            jsonData = try JSONSerialization.data(withJSONObject: data, options: [])
        } catch {
            print("Failed to serialize data: \(error)")
            return
        }
        
        guard let jsonString = String(data: jsonData, encoding: .utf8) else { return }
        
        let script = """
        if (typeof window.\(callback) === 'function') {
            window.\(callback)(\(jsonString));
            delete window.\(callback);
        }
        """
        
        webView.evaluateJavaScript(script) { result, error in
            if let error = error {
                print("JavaScript execution error: \(error)")
            }
        }
    }
    
    // Send custom event to JavaScript
    func sendEvent(name: String, data: [String: Any]) {
        guard let webView = webView else { return }
        
        let jsonData: Data
        do {
            jsonData = try JSONSerialization.data(withJSONObject: data, options: [])
        } catch {
            print("Failed to serialize event data: \(error)")
            return
        }
        
        guard let jsonString = String(data: jsonData, encoding: .utf8) else { return }
        
        let script = """
        window.dispatchEvent(new CustomEvent('\(name)', { detail: \(jsonString) }));
        """
        
        webView.evaluateJavaScript(script, completionHandler: nil)
    }
}

// MARK: - ProcessInfo Extension

extension ProcessInfo {
    var machineArchitecture: String {
        #if arch(x86_64)
        return "x86_64"
        #elseif arch(arm64)
        return "arm64"
        #else
        return "unknown"
        #endif
    }
}
