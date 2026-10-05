//
//  XoverApp.swift
//  Xover
//
//  Main application entry point for Hostprint macOS app
//  Uses SwiftUI App lifecycle (macOS 13+)
//

import SwiftUI

@main
struct XoverApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @StateObject private var appState = AppState()

    init() {
        NSLog("✓ XoverApp.init() called")
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
                .frame(minWidth: 1024, minHeight: 768)
                .task {
                    NSLog("✓ ContentView .task modifier executing")
                    appDelegate.startBackendIfNeeded()
                }
        }
        .commands {
            MenuCommands()
        }
        .defaultSize(width: 1280, height: 900)
        
        Settings {
            PreferencesView()
                .environmentObject(appState)
        }
    }
}

// MARK: - App State

class AppState: ObservableObject {
    @Published var serverURL: String
    @Published var serverStatus: ServerStatus = .unknown
    @Published var backendPort: Int
    @Published var autoStartBackend: Bool
    
    init() {
        // Load backend port first
        let port = UserDefaults.standard.integer(forKey: "backendPort")
        let finalPort = (port == 0) ? 5001 : port
        self.backendPort = finalPort

        // Load auto-start setting (default to false for remote server)
        let autoStartObject = UserDefaults.standard.object(forKey: "autoStartBackend")
        self.autoStartBackend = (autoStartObject == nil) ? false : UserDefaults.standard.bool(forKey: "autoStartBackend")

        // Load server URL last (use local variable to avoid self reference)
        if let savedURL = UserDefaults.standard.string(forKey: "serverURL") {
            self.serverURL = savedURL
        } else {
            // Use remote production server
            self.serverURL = "http://179.255.187.191:3000"
        }
    }
    
    func saveSettings() {
        UserDefaults.standard.set(serverURL, forKey: "serverURL")
        UserDefaults.standard.set(backendPort, forKey: "backendPort")
        UserDefaults.standard.set(autoStartBackend, forKey: "autoStartBackend")
    }
    
    func updateServerURL() {
        serverURL = "http://localhost:\(backendPort)"
        saveSettings()
    }
}

// MARK: - Server Status

enum ServerStatus: Equatable {
    case unknown
    case starting
    case running
    case stopped
    case error(String)
    
    var icon: String {
        switch self {
        case .unknown: return "questionmark.circle"
        case .starting: return "arrow.clockwise.circle"
        case .running: return "checkmark.circle.fill"
        case .stopped: return "xmark.circle"
        case .error: return "exclamationmark.triangle.fill"
        }
    }
    
    var color: Color {
        switch self {
        case .unknown: return .secondary
        case .starting: return .orange
        case .running: return .green
        case .stopped: return .secondary
        case .error: return .red
        }
    }
    
    var description: String {
        switch self {
        case .unknown: return "Unknown"
        case .starting: return "Starting..."
        case .running: return "Running"
        case .stopped: return "Stopped"
        case .error(let message): return "Error: \(message)"
        }
    }
}
