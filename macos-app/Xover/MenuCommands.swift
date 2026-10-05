//
//  MenuCommands.swift
//  Xover
//
//  Native macOS menu bar commands
//

import SwiftUI

struct MenuCommands: Commands {
    var body: some Commands {
        // MARK: - File Menu
        
        CommandGroup(replacing: .newItem) {
            // Remove default "New" command
        }
        
        CommandGroup(after: .newItem) {
            Button("New Task") {
                NotificationCenter.default.post(name: .createNewTask, object: nil)
            }
            .keyboardShortcut("n", modifiers: .command)
            
            Button("New Data Task") {
                NotificationCenter.default.post(name: .createNewDataTask, object: nil)
            }
            .keyboardShortcut("n", modifiers: [.command, .shift])
            
            Divider()
        }
        
        // MARK: - Edit Menu
        
        CommandGroup(after: .pasteboard) {
            Divider()
            
            Button("Find...") {
                NotificationCenter.default.post(name: .showSearch, object: nil)
            }
            .keyboardShortcut("f", modifiers: .command)
        }
        
        // MARK: - View Menu

        CommandGroup(replacing: .toolbar) {
            Button("Reload") {
                NotificationCenter.default.post(name: .reloadWebView, object: nil)
            }
            .keyboardShortcut("r", modifiers: .command)

            Divider()

            Button("Actual Size") {
                NotificationCenter.default.post(name: .resetZoom, object: nil)
            }
            .keyboardShortcut("0", modifiers: .command)

            Button("Zoom In") {
                NotificationCenter.default.post(name: .zoomIn, object: nil)
            }
            .keyboardShortcut("+", modifiers: .command)

            Button("Zoom Out") {
                NotificationCenter.default.post(name: .zoomOut, object: nil)
            }
            .keyboardShortcut("-", modifiers: .command)

            Divider()

            Button("Toggle Developer Tools") {
                NotificationCenter.default.post(name: .toggleDevTools, object: nil)
            }
            .keyboardShortcut("i", modifiers: [.command, .option])
        }
        
        // MARK: - Navigation Menu
        
        CommandMenu("Navigate") {
            Button("Back") {
                NotificationCenter.default.post(name: .webViewGoBack, object: nil)
            }
            .keyboardShortcut("[", modifiers: .command)
            
            Button("Forward") {
                NotificationCenter.default.post(name: .webViewGoForward, object: nil)
            }
            .keyboardShortcut("]", modifiers: .command)
            
            Divider()
            
            Button("Dashboard") {
                NotificationCenter.default.post(name: .navigateTo, object: nil, userInfo: ["path": "/"])
            }
            .keyboardShortcut("1", modifiers: .command)
            
            Button("Tasks") {
                NotificationCenter.default.post(name: .navigateTo, object: nil, userInfo: ["path": "/tasks"])
            }
            .keyboardShortcut("2", modifiers: .command)
            
            Button("Data Tasks") {
                NotificationCenter.default.post(name: .navigateTo, object: nil, userInfo: ["path": "/datatasks"])
            }
            .keyboardShortcut("3", modifiers: .command)
            
            Button("Sites") {
                NotificationCenter.default.post(name: .navigateTo, object: nil, userInfo: ["path": "/sites"])
            }
            .keyboardShortcut("4", modifiers: .command)
            
            Button("RW Print") {
                NotificationCenter.default.post(name: .navigateTo, object: nil, userInfo: ["path": "/rwprint"])
            }
            .keyboardShortcut("5", modifiers: .command)
        }
        
        // MARK: - Help Menu
        
        CommandGroup(replacing: .help) {
            Button("Hostprint Help") {
                if let url = URL(string: "https://github.com/hostprint/hostprint") {
                    NSWorkspace.shared.open(url)
                }
            }
            
            Button("Report Issue") {
                if let url = URL(string: "https://github.com/hostprint/hostprint/issues") {
                    NSWorkspace.shared.open(url)
                }
            }
            
            Divider()
            
            Button("Check for Updates") {
                NotificationCenter.default.post(name: .checkForUpdates, object: nil)
            }
            
            Divider()
            
            Button("About Hostprint") {
                NSApp.orderFrontStandardAboutPanel(nil)
            }
        }
    }
}

// MARK: - Additional Notification Names

extension Notification.Name {
    static let createNewTask = Notification.Name("createNewTask")
    static let createNewDataTask = Notification.Name("createNewDataTask")
    static let showSearch = Notification.Name("showSearch")
    static let resetZoom = Notification.Name("resetZoom")
    static let zoomIn = Notification.Name("zoomIn")
    static let zoomOut = Notification.Name("zoomOut")
    static let toggleDevTools = Notification.Name("toggleDevTools")
    static let checkBackendStatus = Notification.Name("checkBackendStatus")
    static let openBackendLogs = Notification.Name("openBackendLogs")
    static let navigateTo = Notification.Name("navigateTo")
    static let checkForUpdates = Notification.Name("checkForUpdates")
    static let reloadWebView = Notification.Name("reloadWebView")
    static let webViewGoBack = Notification.Name("webViewGoBack")
    static let webViewGoForward = Notification.Name("webViewGoForward")
    static let restartBackend = Notification.Name("restartBackend")
}
