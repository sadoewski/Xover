//
//  PreferencesView.swift
//  Xover
//
//  Application preferences window
//

import SwiftUI

struct PreferencesView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        TabView {
            GeneralPreferencesView()
                .tabItem {
                    Label("General", systemImage: "gear")
                }

            ServerPreferencesView()
                .tabItem {
                    Label("Server", systemImage: "server.rack")
                }

            AppearancePreferencesView()
                .tabItem {
                    Label("Appearance", systemImage: "paintbrush")
                }
        }
        .frame(width: 500, height: 300)
    }
}

// MARK: - General Preferences

struct GeneralPreferencesView: View {
    @EnvironmentObject var appState: AppState
    @AppStorage("notificationsEnabled") private var notificationsEnabled = true

    var body: some View {
        Form {
            Section {
                Toggle("Enable Notifications", isOn: $notificationsEnabled)
            }
        }
        .formStyle(.grouped)
        .padding()
    }
}

// MARK: - Server Preferences

struct ServerPreferencesView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        Form {
            Section("Server Configuration") {
                TextField("Server URL", text: $appState.serverURL)
                    .textFieldStyle(.roundedBorder)

                HStack {
                    Text("Port:")
                    TextField("Port", value: $appState.backendPort, format: .number)
                        .frame(width: 100)
                }

                Toggle("Auto-start local backend", isOn: $appState.autoStartBackend)
            }

            Section {
                HStack {
                    Image(systemName: appState.serverStatus.icon)
                        .foregroundColor(appState.serverStatus.color)

                    Text(appState.serverStatus.description)
                }
            }

            Section {
                Button("Save") {
                    appState.saveSettings()
                }
                .buttonStyle(.borderedProminent)
            }
        }
        .formStyle(.grouped)
        .padding()
    }
}

// MARK: - Appearance Preferences

struct AppearancePreferencesView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        Form {
            Section {
                Picker("Appearance", selection: $appState.appearance) {
                    ForEach(AppState.AppAppearance.allCases) { appearance in
                        Text(appearance.rawValue).tag(appearance)
                    }
                }
                .pickerStyle(.radioGroup)
                .onChange(of: appState.appearance) { _ in
                    appState.applyAppearance()
                    appState.saveSettings()
                }
            }
        }
        .formStyle(.grouped)
        .padding()
    }
}

#Preview {
    PreferencesView()
        .environmentObject(AppState())
}
