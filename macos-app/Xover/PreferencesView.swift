//
//  PreferencesView.swift
//  Xover
//
//  Settings window for backend configuration and preferences
//

import SwiftUI

struct PreferencesView: View {
    @EnvironmentObject var appState: AppState
    @State private var backendPort: String = ""
    @State private var autoStartBackend: Bool = true
    @State private var dbHost: String = "localhost"
    @State private var dbPort: String = "5432"
    @State private var dbName: String = "hostprint"
    @State private var showAdvanced: Bool = false
    @State private var showSaveConfirmation: Bool = false
    @State private var standaloneMode: Bool = false
    
    var body: some View {
        TabView {
            // MARK: - General Tab
            generalTab
                .tabItem {
                    Label("General", systemImage: "gear")
                }
            
            // MARK: - Backend Tab
            backendTab
                .tabItem {
                    Label("Backend", systemImage: "server.rack")
                }
            
            // MARK: - Advanced Tab
            advancedTab
                .tabItem {
                    Label("Advanced", systemImage: "slider.horizontal.3")
                }
        }
        .frame(width: 600, height: 500)
        .onAppear {
            loadSettings()
        }
    }
    
    // MARK: - General Tab
    
    private var generalTab: some View {
        Form {
            Section {
                VStack(alignment: .leading, spacing: 16) {
                    HStack {
                        Image(systemName: "app.fill")
                            .font(.system(size: 48))
                            .foregroundColor(.accentColor)
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Hostprint")
                                .font(.system(size: 20, weight: .semibold))
                            
                            Text("Task Management & Data Processing")
                                .font(.system(size: 13))
                                .foregroundColor(.secondary)
                            
                            Text("Version 1.0.0")
                                .font(.system(size: 11, design: .monospaced))
                                .foregroundColor(.tertiary)
                        }
                    }
                    .padding(.vertical, 8)
                    
                    Divider()
                    
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Application")
                            .font(.system(size: 13, weight: .semibold))
                        
                        Toggle("Launch at login", isOn: .constant(false))
                            .disabled(true)
                            .help("Coming soon")
                        
                        Toggle("Show in menu bar", isOn: .constant(false))
                            .disabled(true)
                            .help("Coming soon")
                        
                        Toggle("Automatically check for updates", isOn: .constant(true))
                            .disabled(true)
                            .help("Coming soon")
                    }
                }
                .padding()
            }
        }
        .formStyle(.grouped)
    }
    
    // MARK: - Backend Tab
    
    private var backendTab: some View {
        Form {
            Section {
                VStack(alignment: .leading, spacing: 16) {
                    // Server Status
                    HStack(spacing: 12) {
                        Image(systemName: appState.serverStatus.icon)
                            .foregroundColor(appState.serverStatus.color)
                            .font(.system(size: 24))
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Backend Status")
                                .font(.system(size: 13, weight: .semibold))
                            
                            Text(appState.serverStatus.description)
                                .font(.system(size: 12))
                                .foregroundColor(.secondary)
                        }
                        
                        Spacer()
                        
                        // Control Buttons
                        HStack(spacing: 8) {
                            if appState.serverStatus == .stopped || appState.serverStatus == .unknown {
                                Button("Start") {
                                    if let appDelegate = NSApp.delegate as? AppDelegate {
                                        appDelegate.startBackend()
                                    }
                                }
                                .buttonStyle(.borderedProminent)
                            } else if appState.serverStatus == .running {
                                Button("Stop") {
                                    if let appDelegate = NSApp.delegate as? AppDelegate {
                                        appDelegate.stopBackend()
                                    }
                                }
                                
                                Button("Restart") {
                                    if let appDelegate = NSApp.delegate as? AppDelegate {
                                        appDelegate.restartBackend()
                                    }
                                }
                                .buttonStyle(.borderedProminent)
                            }
                        }
                    }
                    .padding()
                    .background(Color(NSColor.controlBackgroundColor))
                    .cornerRadius(8)
                    
                    Divider()

                    // Standalone Mode Section
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Operation Mode")
                            .font(.system(size: 13, weight: .semibold))

                        Toggle("Standalone Mode (Local Only)", isOn: $standaloneMode)
                            .onChange(of: standaloneMode) { newValue in
                                SyncManager.shared.standaloneMode = newValue
                                UserDefaults.standard.set(newValue, forKey: "standaloneMode")
                            }

                        if standaloneMode {
                            HStack(spacing: 8) {
                                Image(systemName: "externaldrive.fill")
                                    .foregroundColor(.orange)
                                    .font(.system(size: 12))

                                Text("Working in local-only mode - cloud sync disabled")
                                    .font(.system(size: 11))
                                    .foregroundColor(.secondary)
                            }
                            .padding(.leading, 24)
                            .padding(.top, 4)
                        }
                    }

                    if !standaloneMode {
                        Divider()

                        // Backend Configuration (only shown when not in standalone mode)
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Cloud Sync Configuration")
                                .font(.system(size: 13, weight: .semibold))

                            HStack {
                                Text("Backend Port:")
                                    .frame(width: 120, alignment: .trailing)

                                TextField("5000", text: $backendPort)
                                    .textFieldStyle(.roundedBorder)
                                    .frame(width: 100)

                                Text("Default: 5000")
                                    .font(.system(size: 11))
                                    .foregroundColor(.secondary)
                            }

                            Toggle("Auto-start backend on launch", isOn: $autoStartBackend)
                                .padding(.leading, 132)

                            HStack {
                                Text("Server URL:")
                                    .frame(width: 120, alignment: .trailing)

                                Text(appState.serverURL)
                                    .font(.system(size: 11, design: .monospaced))
                                    .foregroundColor(.secondary)
                                    .textSelection(.enabled)
                            }
                        }
                    }

                    Divider()
                    
                    // Actions
                    HStack {
                        Spacer()
                        
                        Button("Reset to Defaults") {
                            resetToDefaults()
                        }
                        
                        Button("Save Changes") {
                            saveBackendSettings()
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(backendPort == String(appState.backendPort) && autoStartBackend == appState.autoStartBackend)
                    }
                    
                    if showSaveConfirmation {
                        HStack {
                            Spacer()
                            Text("Settings saved successfully")
                                .font(.system(size: 11))
                                .foregroundColor(.green)
                        }
                        .transition(.opacity)
                    }
                }
                .padding()
            }
        }
        .formStyle(.grouped)
    }
    
    // MARK: - Advanced Tab
    
    private var advancedTab: some View {
        Form {
            Section {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Database Configuration")
                        .font(.system(size: 13, weight: .semibold))
                    
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("Host:")
                                .frame(width: 100, alignment: .trailing)
                            TextField("localhost", text: $dbHost)
                                .textFieldStyle(.roundedBorder)
                                .frame(maxWidth: 300)
                        }
                        
                        HStack {
                            Text("Port:")
                                .frame(width: 100, alignment: .trailing)
                            TextField("5432", text: $dbPort)
                                .textFieldStyle(.roundedBorder)
                                .frame(width: 100)
                        }
                        
                        HStack {
                            Text("Database:")
                                .frame(width: 100, alignment: .trailing)
                            TextField("hostprint", text: $dbName)
                                .textFieldStyle(.roundedBorder)
                                .frame(maxWidth: 300)
                        }
                    }
                    
                    Text("Note: Database credentials are stored in the backend .env file")
                        .font(.system(size: 11))
                        .foregroundColor(.secondary)
                        .padding(.leading, 112)
                    
                    Divider()
                    
                    // Developer Options
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Developer")
                            .font(.system(size: 13, weight: .semibold))
                        
                        Button("Open Backend Directory") {
                            openBackendDirectory()
                        }
                        
                        Button("View Backend Logs") {
                            // TODO: Open logs viewer
                        }
                        
                        Button("Open Web Inspector") {
                            NotificationCenter.default.post(name: .toggleDevTools, object: nil)
                        }
                    }
                    .padding(.leading, 112)
                    
                    Divider()
                    
                    // Cache & Data
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Data Management")
                            .font(.system(size: 13, weight: .semibold))
                        
                        Button("Clear WebView Cache") {
                            clearWebViewCache()
                        }
                        
                        Button("Reset All Settings") {
                            resetAllSettings()
                        }
                        .foregroundColor(.red)
                    }
                    .padding(.leading, 112)
                }
                .padding()
            }
        }
        .formStyle(.grouped)
    }
    
    // MARK: - Actions
    
    private func loadSettings() {
        backendPort = String(appState.backendPort)
        autoStartBackend = appState.autoStartBackend
        standaloneMode = UserDefaults.standard.bool(forKey: "standaloneMode")

        // Load database settings from UserDefaults
        dbHost = UserDefaults.standard.string(forKey: "dbHost") ?? "localhost"
        dbPort = UserDefaults.standard.string(forKey: "dbPort") ?? "5432"
        dbName = UserDefaults.standard.string(forKey: "dbName") ?? "hostprint"
    }
    
    private func saveBackendSettings() {
        // Validate port
        guard let port = Int(backendPort), port > 0, port < 65536 else {
            // Show error
            return
        }
        
        appState.backendPort = port
        appState.autoStartBackend = autoStartBackend
        appState.updateServerURL()
        
        // Show confirmation
        withAnimation {
            showSaveConfirmation = true
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            withAnimation {
                showSaveConfirmation = false
            }
        }
        
        // Prompt to restart backend if running
        if appState.serverStatus == .running {
            let alert = NSAlert()
            alert.messageText = "Restart Backend?"
            alert.informativeText = "Backend settings have changed. Restart the backend to apply changes?"
            alert.alertStyle = .informational
            alert.addButton(withTitle: "Restart Now")
            alert.addButton(withTitle: "Later")
            
            if alert.runModal() == .alertFirstButtonReturn {
                if let appDelegate = NSApp.delegate as? AppDelegate {
                    appDelegate.restartBackend()
                }
            }
        }
    }
    
    private func resetToDefaults() {
        backendPort = "5000"
        autoStartBackend = true
        standaloneMode = false
        dbHost = "localhost"
        dbPort = "5432"
        dbName = "hostprint"
    }
    
    private func resetAllSettings() {
        let alert = NSAlert()
        alert.messageText = "Reset All Settings?"
        alert.informativeText = "This will reset all preferences to default values. This action cannot be undone."
        alert.alertStyle = .warning
        alert.addButton(withTitle: "Reset")
        alert.addButton(withTitle: "Cancel")

        if alert.runModal() == .alertFirstButtonReturn {
            UserDefaults.standard.removeObject(forKey: "serverURL")
            UserDefaults.standard.removeObject(forKey: "backendPort")
            UserDefaults.standard.removeObject(forKey: "autoStartBackend")
            UserDefaults.standard.removeObject(forKey: "standaloneMode")
            UserDefaults.standard.removeObject(forKey: "dbHost")
            UserDefaults.standard.removeObject(forKey: "dbPort")
            UserDefaults.standard.removeObject(forKey: "dbName")

            resetToDefaults()
            appState.backendPort = 5000
            appState.autoStartBackend = true
            appState.updateServerURL()
            SyncManager.shared.standaloneMode = false
        }
    }
    
    private func openBackendDirectory() {
        let backendPath = getBackendPath()
        let url = URL(fileURLWithPath: backendPath)
        NSWorkspace.shared.open(url)
    }
    
    private func getBackendPath() -> String {
        if let bundlePath = Bundle.main.resourcePath {
            let embeddedPath = "\(bundlePath)/backend"
            if FileManager.default.fileExists(atPath: embeddedPath) {
                return embeddedPath
            }
        }
        
        let projectPath = FileManager.default.currentDirectoryPath
        return "\(projectPath)/../../backend"
    }
    
    private func clearWebViewCache() {
        let websiteDataTypes = Set([WKWebsiteDataTypeDiskCache, WKWebsiteDataTypeMemoryCache])
        let date = Date(timeIntervalSince1970: 0)
        
        WKWebsiteDataStore.default().removeData(ofTypes: websiteDataTypes, modifiedSince: date) {
            print("✓ WebView cache cleared")
        }
    }
}

// MARK: - Preview

struct PreferencesView_Previews: PreviewProvider {
    static var previews: some View {
        PreferencesView()
            .environmentObject(AppState())
    }
}
