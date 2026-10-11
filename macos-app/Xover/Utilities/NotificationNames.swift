//
//  NotificationNames.swift
//  Xover
//
//  Centralized notification names for app-wide events
//

import Foundation

extension Notification.Name {
    // MARK: - Navigation
    static let navigateTo = Notification.Name("navigateTo")
    static let reloadWebView = Notification.Name("reloadWebView")
    static let webViewGoBack = Notification.Name("webViewGoBack")
    static let webViewGoForward = Notification.Name("webViewGoForward")
    static let restartBackend = Notification.Name("restartBackend")

    // MARK: - Tasks
    static let createNewTask = Notification.Name("createNewTask")
    static let createNewDataTask = Notification.Name("createNewDataTask")
    static let completeTask = Notification.Name("completeTask")
    static let deleteTask = Notification.Name("deleteTask")
    static let taskUpdated = Notification.Name("taskUpdated")

    // MARK: - Authentication
    static let userDidLogin = Notification.Name("userDidLogin")
    static let userDidLogout = Notification.Name("userDidLogout")

    // MARK: - App State
    static let appDidBecomeActive = Notification.Name("appDidBecomeActive")
    static let appWillTerminate = Notification.Name("appWillTerminate")
}
