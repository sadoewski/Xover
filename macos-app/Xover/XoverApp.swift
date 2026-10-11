//
//  XoverApp.swift
//  Xover
//
//  Main application entry point for Hostprint macOS app
//

import SwiftUI

@main
struct XoverApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            if appState.isAuthenticated {
                MainWindowView()
                    .environmentObject(appState)
            } else {
                LoginView()
                    .environmentObject(appState)
            }
        }
        .windowStyle(.automatic)
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
