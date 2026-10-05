//
//  AppDelegate.swift
//  Xover
//
//  Manages application lifecycle and embedded Node.js backend
//

import Cocoa
import Foundation

class AppDelegate: NSObject, NSApplicationDelegate {
    private var backendProcess: Process?
    private var backendPort: Int = 5000
    private var backendMonitorTimer: Timer?
    
    // MARK: - Application Lifecycle
    
    func applicationDidFinishLaunching(_ notification: Notification) {
        NSLog("✓ applicationDidFinishLaunching called")

        // Load backend port from preferences
        backendPort = UserDefaults.standard.integer(forKey: "backendPort")
        if backendPort == 0 {
            backendPort = 5001
        }
        NSLog("📡 Backend port set to: \(backendPort)")
    }
    
    func applicationWillTerminate(_ notification: Notification) {
        print("✓ Stopping backend...")
        stopBackend()
        backendMonitorTimer?.invalidate()
    }

    func startBackendIfNeeded() {
        // Check if we should auto-start backend
        let autoStart = UserDefaults.standard.bool(forKey: "autoStartBackend")
        let hasKey = UserDefaults.standard.object(forKey: "autoStartBackend") != nil
        NSLog("⚙️  Auto-start: \(autoStart), has key: \(hasKey)")

        // Only start backend if explicitly enabled (for local development)
        if autoStart && hasKey {
            NSLog("🚀 Attempting to start backend...")
            startBackend()
        } else {
            NSLog("⏸️  Backend auto-start is disabled (remote mode)")
        }

        // Monitor backend health every 5 seconds (only if backend should be running locally)
        if autoStart && hasKey {
            backendMonitorTimer = Timer.scheduledTimer(
                withTimeInterval: 5.0,
                repeats: true
            ) { [weak self] _ in
                self?.checkBackendHealth()
            }
        }
    }
    
    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }
    
    // MARK: - Backend Management
    
    func startBackend() {
        guard backendProcess == nil else {
            print("⚠️ Backend already running")
            return
        }

        let backendPath = getBackendPath()
        guard FileManager.default.fileExists(atPath: backendPath) else {
            print("❌ Backend not found at: \(backendPath)")
            postNotification(.backendError, userInfo: ["error": "Backend bundle not found"])
            return
        }

        // Use embedded Node.js
        let nodePath = "\(backendPath)/nodejs/bin/node"
        guard FileManager.default.fileExists(atPath: nodePath) else {
            print("❌ Node.js not found at: \(nodePath)")
            postNotification(.backendError, userInfo: ["error": "Node.js runtime not found"])
            return
        }

        let process = Process()
        process.executableURL = URL(fileURLWithPath: nodePath)
        process.arguments = ["\(backendPath)/src/index.js"]
        process.currentDirectoryURL = URL(fileURLWithPath: backendPath)

        // Set environment variables
        var environment = ProcessInfo.processInfo.environment
        environment["PORT"] = String(backendPort)
        environment["NODE_ENV"] = "production"
        environment["DB_TYPE"] = "sqlite"
        environment["DYLD_LIBRARY_PATH"] = "\(backendPath)/nodejs/lib"

        // Set database path to Application Support
        let appSupport = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first!
        let appDataDir = appSupport.appendingPathComponent("com.hostprint.Xover", isDirectory: true)
        try? FileManager.default.createDirectory(at: appDataDir, withIntermediateDirectories: true)
        let dbPath = appDataDir.appendingPathComponent("hostprint.db").path
        environment["DB_PATH"] = dbPath

        environment["JWT_SECRET"] = getEnvValue("JWT_SECRET") ?? generateSecureToken()
        environment["ALLOWED_ORIGINS"] = "http://localhost:\(backendPort)"
        
        process.environment = environment
        process.currentDirectoryURL = URL(fileURLWithPath: backendPath)
        
        // Capture stdout/stderr
        let outputPipe = Pipe()
        let errorPipe = Pipe()
        process.standardOutput = outputPipe
        process.standardError = errorPipe
        
        outputPipe.fileHandleForReading.readabilityHandler = { handle in
            let data = handle.availableData
            if let output = String(data: data, encoding: .utf8), !output.isEmpty {
                print("Backend: \(output.trimmingCharacters(in: .whitespacesAndNewlines))")
            }
        }
        
        errorPipe.fileHandleForReading.readabilityHandler = { handle in
            let data = handle.availableData
            if let output = String(data: data, encoding: .utf8), !output.isEmpty {
                print("Backend Error: \(output.trimmingCharacters(in: .whitespacesAndNewlines))")
            }
        }
        
        do {
            try process.run()
            backendProcess = process
            print("✓ Backend starting on port \(backendPort)...")
            postNotification(.backendStarting)
            
            // Wait 2 seconds and check if it's running
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) { [weak self] in
                self?.checkBackendHealth()
            }
        } catch {
            print("❌ Failed to start backend: \(error.localizedDescription)")
            postNotification(.backendError, userInfo: ["error": error.localizedDescription])
        }
    }
    
    func stopBackend() {
        guard let process = backendProcess else { return }
        
        if process.isRunning {
            process.terminate()
            process.waitUntilExit()
        }
        
        backendProcess = nil
        postNotification(.backendStopped)
        print("✓ Backend stopped")
    }
    
    func restartBackend() {
        stopBackend()
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self] in
            self?.startBackend()
        }
    }
    
    // MARK: - Health Check
    
    private func checkBackendHealth() {
        let url = URL(string: "http://localhost:\(backendPort)/api/health")!
        
        var request = URLRequest(url: url)
        request.timeoutInterval = 2.0
        
        URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            DispatchQueue.main.async {
                if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 {
                    self?.postNotification(.backendRunning)
                } else {
                    // Backend not responding, but process might still be starting
                    if self?.backendProcess?.isRunning == true {
                        // Still starting up
                    } else {
                        self?.postNotification(.backendStopped)
                    }
                }
            }
        }.resume()
    }
    
    // MARK: - Helpers
    
    private func getBackendPath() -> String {
        // Look for embedded backend-bundle in app bundle
        if let bundlePath = Bundle.main.resourcePath {
            let embeddedPath = "\(bundlePath)/backend-bundle"
            if FileManager.default.fileExists(atPath: embeddedPath) {
                return embeddedPath
            }
        }

        // Fallback: development mode (relative to Xcode)
        let projectPath = FileManager.default.currentDirectoryPath
        return "\(projectPath)/../../backend"
    }
    
    private func getEnvValue(_ key: String) -> String? {
        // Try to read from embedded .env file
        let backendPath = getBackendPath()
        let envPath = "\(backendPath)/.env"
        
        guard let envContent = try? String(contentsOfFile: envPath, encoding: .utf8) else {
            return nil
        }
        
        for line in envContent.components(separatedBy: .newlines) {
            let trimmed = line.trimmingCharacters(in: .whitespaces)
            if trimmed.starts(with: "#") || trimmed.isEmpty { continue }
            
            let parts = trimmed.split(separator: "=", maxSplits: 1)
            if parts.count == 2 && parts[0] == key {
                return String(parts[1])
            }
        }
        
        return nil
    }
    
    private func generateSecureToken() -> String {
        let characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        return String((0..<32).map { _ in characters.randomElement()! })
    }
    
    private func postNotification(_ name: Notification.Name, userInfo: [String: Any]? = nil) {
        NotificationCenter.default.post(name: name, object: nil, userInfo: userInfo)
    }
}

// MARK: - Notification Names

extension Notification.Name {
    static let backendStarting = Notification.Name("backendStarting")
    static let backendRunning = Notification.Name("backendRunning")
    static let backendStopped = Notification.Name("backendStopped")
    static let backendError = Notification.Name("backendError")
}
