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
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
                .frame(minWidth: 1024, minHeight: 768)
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
        // Load from UserDefaults
        self.backendPort = UserDefaults.standard.integer(forKey: "backendPort")
        if self.backendPort == 0 {
            self.backendPort = 5000 // Default port
        }
        
        self.serverURL = UserDefaults.standard.string(forKey: "serverURL") 
            ?? "http://localhost:\(backendPort)"
        
        self.autoStartBackend = UserDefaults.standard.bool(forKey: "autoStartBackend")
        if UserDefaults.standard.object(forKey: "autoStartBackend") == nil {
            self.autoStartBackend = true // Default: auto-start
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

enum ServerStatus {
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
