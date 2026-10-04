//
//  BackendManager.swift
//  Xover
//
//  Backend process manager for Node.js server
//

import Foundation
import Combine

class BackendManager: ObservableObject {
    @Published var isRunning = false
    @Published var lastError: String?
    @Published var backendURL: String = "http://localhost:3001"
    
    private var process: Process?
    private var healthCheckTimer: Timer?
    private var restartAttempts = 0
    private let maxRestartAttempts = 3
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Initialization
    
    init() {
        setupTerminationHandler()
    }
    
    deinit {
        shutdown()
    }
    
    // MARK: - Process Management
    
    func start() {
        guard !isRunning else {
            print("Backend already running")
            return
        }
        
        guard let nodePath = findNodeRuntime() else {
            lastError = "Node.js runtime not found in app bundle"
            print("Error: \(lastError ?? "")")
            return
        }
        
        guard let backendScript = findBackendScript() else {
            lastError = "Backend script not found in app bundle"
            print("Error: \(lastError ?? "")")
            return
        }
        
        launchBackend(nodePath: nodePath, scriptPath: backendScript)
    }
    
    private func launchBackend(nodePath: String, scriptPath: String) {
        let process = Process()
        self.process = process
        
        // Configure process
        process.executableURL = URL(fileURLWithPath: nodePath)
        process.arguments = [scriptPath]
        
        // Set up environment
        var environment = ProcessInfo.processInfo.environment
        environment["NODE_ENV"] = "production"
        environment["PORT"] = "3001"
        environment["HOST"] = "127.0.0.1"
        
        // Add app bundle resources to NODE_PATH
        if let resourcePath = Bundle.main.resourcePath {
            let nodeModulesPath = "\(resourcePath)/backend/node_modules"
            environment["NODE_PATH"] = nodeModulesPath
        }
        
        process.environment = environment
        
        // Set working directory to backend folder
        if let resourcePath = Bundle.main.resourcePath {
            let backendPath = "\(resourcePath)/backend"
            process.currentDirectoryURL = URL(fileURLWithPath: backendPath)
        }
        
        // Capture output
        let outputPipe = Pipe()
        let errorPipe = Pipe()
        process.standardOutput = outputPipe
        process.standardError = errorPipe
        
        // Monitor output
        outputPipe.fileHandleForReading.readabilityHandler = { handle in
            let data = handle.availableData
            if let output = String(data: data, encoding: .utf8), !output.isEmpty {
                print("[Backend] \(output.trimmingCharacters(in: .whitespacesAndNewlines))")
            }
        }
        
        errorPipe.fileHandleForReading.readabilityHandler = { handle in
            let data = handle.availableData
            if let output = String(data: data, encoding: .utf8), !output.isEmpty {
                print("[Backend Error] \(output.trimmingCharacters(in: .whitespacesAndNewlines))")
            }
        }
        
        // Handle process termination
        process.terminationHandler = { [weak self] process in
            DispatchQueue.main.async {
                self?.handleProcessTermination(exitCode: process.terminationStatus)
            }
        }
        
        // Launch process
        do {
            try process.run()
            isRunning = true
            lastError = nil
            restartAttempts = 0
            print("Backend process started (PID: \(process.processIdentifier))")
            
            // Start health monitoring
            startHealthCheck()
        } catch {
            lastError = "Failed to launch backend: \(error.localizedDescription)"
            print("Error: \(lastError ?? "")")
            isRunning = false
        }
    }
    
    // MARK: - Process Discovery
    
    private func findNodeRuntime() -> String? {
        guard let resourcePath = Bundle.main.resourcePath else {
            return nil
        }
        
        // Check for bundled Node.js in various possible locations
        let possiblePaths = [
            "\(resourcePath)/node/bin/node",
            "\(resourcePath)/nodejs/bin/node",
            "\(resourcePath)/runtime/node",
            "/usr/local/bin/node",
            "/opt/homebrew/bin/node"
        ]
        
        for path in possiblePaths {
            if FileManager.default.fileExists(atPath: path) {
                print("Found Node.js runtime at: \(path)")
                return path
            }
        }
        
        return nil
    }
    
    private func findBackendScript() -> String? {
        guard let resourcePath = Bundle.main.resourcePath else {
            return nil
        }
        
        let scriptPath = "\(resourcePath)/backend/src/index.js"
        
        if FileManager.default.fileExists(atPath: scriptPath) {
            print("Found backend script at: \(scriptPath)")
            return scriptPath
        }
        
        return nil
    }
    
    // MARK: - Health Monitoring
    
    private func startHealthCheck() {
        // Initial delay to allow server to start
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) { [weak self] in
            self?.performHealthCheck()
            
            // Schedule periodic checks every 30 seconds
            self?.healthCheckTimer = Timer.scheduledTimer(withTimeInterval: 30.0, repeats: true) { [weak self] _ in
                self?.performHealthCheck()
            }
        }
    }
    
    private func performHealthCheck() {
        guard isRunning else { return }
        
        let healthURL = URL(string: "\(backendURL)/health")!
        
        let task = URLSession.shared.dataTask(with: healthURL) { [weak self] data, response, error in
            DispatchQueue.main.async {
                if let error = error {
                    print("Health check failed: \(error.localizedDescription)")
                    self?.handleHealthCheckFailure()
                    return
                }
                
                if let httpResponse = response as? HTTPURLResponse,
                   httpResponse.statusCode == 200 {
                    print("Health check passed")
                    self?.restartAttempts = 0
                } else {
                    print("Health check failed: unexpected response")
                    self?.handleHealthCheckFailure()
                }
            }
        }
        
        task.resume()
    }
    
    private func handleHealthCheckFailure() {
        guard restartAttempts < maxRestartAttempts else {
            lastError = "Backend health check failed after \(maxRestartAttempts) attempts"
            print("Error: \(lastError ?? "")")
            shutdown()
            return
        }
        
        restartAttempts += 1
        print("Health check failed, attempting restart (\(restartAttempts)/\(maxRestartAttempts))")
        restart()
    }
    
    // MARK: - Process Termination
    
    private func handleProcessTermination(exitCode: Int32) {
        print("Backend process terminated with exit code: \(exitCode)")
        isRunning = false
        healthCheckTimer?.invalidate()
        healthCheckTimer = nil
        
        // Attempt restart if crashed unexpectedly
        if exitCode != 0 && restartAttempts < maxRestartAttempts {
            restartAttempts += 1
            print("Backend crashed, attempting restart (\(restartAttempts)/\(maxRestartAttempts))")
            
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self] in
                self?.start()
            }
        } else if exitCode != 0 {
            lastError = "Backend process crashed after \(maxRestartAttempts) restart attempts"
            print("Error: \(lastError ?? "")")
        }
    }
    
    // MARK: - Shutdown Management
    
    func shutdown() {
        guard isRunning, let process = process else {
            print("Backend not running")
            return
        }
        
        print("Shutting down backend gracefully...")
        
        // Stop health checks
        healthCheckTimer?.invalidate()
        healthCheckTimer = nil
        
        // Try graceful shutdown first
        if process.isRunning {
            process.terminate()
            
            // Wait up to 5 seconds for graceful shutdown
            DispatchQueue.global().asyncAfter(deadline: .now() + 5.0) { [weak self] in
                if let process = self?.process, process.isRunning {
                    print("Force killing backend process")
                    process.interrupt()
                }
            }
        }
        
        isRunning = false
        self.process = nil
        print("Backend shutdown complete")
    }
    
    func restart() {
        shutdown()
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self] in
            self?.start()
        }
    }
    
    // MARK: - App Lifecycle
    
    private func setupTerminationHandler() {
        // Handle app termination
        NotificationCenter.default.addObserver(
            forName: NSApplication.willTerminateNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.shutdown()
        }
        
        // Handle system sleep
        NSWorkspace.shared.notificationCenter.addObserver(
            forName: NSWorkspace.willSleepNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.shutdown()
        }
        
        // Handle system wake
        NSWorkspace.shared.notificationCenter.addObserver(
            forName: NSWorkspace.didWakeNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
                self?.start()
            }
        }
    }
}

// MARK: - Convenience Extensions

extension BackendManager {
    var statusMessage: String {
        if isRunning {
            return "Backend running on \(backendURL)"
        } else if let error = lastError {
            return "Error: \(error)"
        } else {
            return "Backend stopped"
        }
    }
    
    var isHealthy: Bool {
        return isRunning && lastError == nil
    }
}
