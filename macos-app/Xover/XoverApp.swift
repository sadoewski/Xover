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

    private func configureWindow() {
        DispatchQueue.main.async {
            if let window = NSApp.windows.first {
                window.titlebarAppearsTransparent = true
                window.titleVisibility = .hidden
                window.isOpaque = false
                window.backgroundColor = .clear
                window.styleMask.insert(.fullSizeContentView)

                // Configure toolbar for fullscreen
                let toolbar = NSToolbar()
                toolbar.showsBaselineSeparator = false
                window.toolbar = toolbar
                window.toolbarStyle = .unified
            }
        }
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
                .frame(minWidth: 1024, minHeight: 768)
                .onAppear {
                    configureWindow()
                }
                .task {
                    NSLog("✓ ContentView .task modifier executing")
                    appDelegate.startBackendIfNeeded()
                }
        }
        .commands {
            MenuCommands()
        }
        .defaultSize(width: 1280, height: 900)
        .windowStyle(.hiddenTitleBar)
        .windowToolbarStyle(.unified(showsTitle: false))
        
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
    @Published var appearance: AppAppearance = .auto

    enum AppAppearance: String, CaseIterable, Identifiable {
        case light = "Light"
        case dark = "Dark"
        case auto = "Auto"

        var id: String { rawValue }
    }

    init() {
        // Load backend port first
        let port = UserDefaults.standard.integer(forKey: "backendPort")
        let finalPort = (port == 0) ? 5001 : port
        self.backendPort = finalPort

        // Load auto-start setting (default to false for remote server)
        let autoStartObject = UserDefaults.standard.object(forKey: "autoStartBackend")
        self.autoStartBackend = (autoStartObject == nil) ? false : UserDefaults.standard.bool(forKey: "autoStartBackend")

        // Load appearance setting
        if let savedAppearance = UserDefaults.standard.string(forKey: "appearance"),
           let appearance = AppAppearance(rawValue: savedAppearance) {
            self.appearance = appearance
        }

        // Load server URL last (use local variable to avoid self reference)
        if let savedURL = UserDefaults.standard.string(forKey: "serverURL") {
            self.serverURL = savedURL
        } else {
            // Use remote production server
            self.serverURL = "http://179.255.187.191:3000"
        }

        // Apply appearance
        applyAppearance()
    }

    func saveSettings() {
        UserDefaults.standard.set(serverURL, forKey: "serverURL")
        UserDefaults.standard.set(backendPort, forKey: "backendPort")
        UserDefaults.standard.set(autoStartBackend, forKey: "autoStartBackend")
        UserDefaults.standard.set(appearance.rawValue, forKey: "appearance")
    }

    func updateServerURL() {
        serverURL = "http://localhost:\(backendPort)"
        saveSettings()
    }

    func applyAppearance() {
        DispatchQueue.main.async {
            switch self.appearance {
            case .light:
                NSApp.appearance = NSAppearance(named: .aqua)
            case .dark:
                NSApp.appearance = NSAppearance(named: .darkAqua)
            case .auto:
                NSApp.appearance = nil
            }
        }
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
