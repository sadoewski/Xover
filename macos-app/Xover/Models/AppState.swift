//
//  AppState.swift
//  Xover
//
//  Application state and configuration
//

import SwiftUI

@MainActor
class AppState: ObservableObject {
    // MARK: - Server Configuration
    @Published var serverURL: String
    @Published var serverStatus: ServerStatus = .unknown
    @Published var backendPort: Int
    @Published var autoStartBackend: Bool
    @Published var appearance: AppAppearance = .auto

    // MARK: - Authentication
    @Published var isAuthenticated: Bool = false
    @Published var authToken: String?
    @Published var currentUser: User?

    // MARK: - Tasks
    @Published var tasks: [TaskItem] = []
    @Published var isLoadingTasks: Bool = false
    @Published var taskGroups: [TaskGroupModel] = []
    @Published var priorities: [Priority] = []

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

        // Load auto-start setting
        let autoStartObject = UserDefaults.standard.object(forKey: "autoStartBackend")
        self.autoStartBackend = (autoStartObject == nil) ? false : UserDefaults.standard.bool(forKey: "autoStartBackend")

        // Load appearance setting
        if let savedAppearance = UserDefaults.standard.string(forKey: "appearance"),
           let appearance = AppAppearance(rawValue: savedAppearance) {
            self.appearance = appearance
        }

        // Load server URL
        if let savedURL = UserDefaults.standard.string(forKey: "serverURL") {
            self.serverURL = savedURL
        } else {
            self.serverURL = "http://localhost:3000"
        }

        // Load auth token
        if let token = KeychainHelper.getToken() {
            self.authToken = token
            self.isAuthenticated = true
        }

        applyAppearance()
    }

    // MARK: - Settings

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
        switch self.appearance {
        case .light:
            NSApp.appearance = NSAppearance(named: .aqua)
        case .dark:
            NSApp.appearance = NSAppearance(named: .darkAqua)
        case .auto:
            NSApp.appearance = nil
        }
    }

    // MARK: - Authentication

    func login(username: String, password: String) async throws {
        let apiService = APIService.shared
        let response = try await apiService.login(username: username, password: password)

        self.authToken = response.token
        KeychainHelper.saveToken(response.token)

        // Set current user from response
        self.currentUser = response.user

        self.isAuthenticated = true
    }

    func logout() {
        self.authToken = nil
        self.currentUser = nil
        self.isAuthenticated = false
        self.tasks = []
        KeychainHelper.deleteToken()
    }

    private func loadUserProfile() async throws {
        let apiService = APIService.shared
        self.currentUser = try await apiService.getUserProfile()
    }

    // MARK: - Tasks

    func loadTasks() async {
        guard isAuthenticated else { return }

        isLoadingTasks = true
        defer { isLoadingTasks = false }

        do {
            let apiService = APIService.shared
            self.tasks = try await apiService.getTasks()
        } catch {
            print("Failed to load tasks: \(error)")
        }
    }

    func createTaskItem(_ task: TaskItem) async throws {
        let apiService = APIService.shared
        let newTask = try await apiService.createTask(task)
        self.tasks.append(newTask)
    }

    func updateTaskItem(_ task: TaskItem) async throws {
        let apiService = APIService.shared
        let updatedTask = try await apiService.updateTask(task)

        if let index = tasks.firstIndex(where: { $0.id == task.id }) {
            tasks[index] = updatedTask
        }
    }

    func deleteTaskItem(_ task: TaskItem) async throws {
        let apiService = APIService.shared
        try await apiService.deleteTask(task.id!)

        if let index = tasks.firstIndex(where: { $0.id == task.id }) {
            tasks.remove(at: index)
        }
    }

    // MARK: - Task Groups

    func loadTaskGroups() async {
        guard isAuthenticated else { return }

        do {
            let apiService = APIService.shared
            self.taskGroups = try await apiService.getTaskGroups()
        } catch {
            print("Failed to load task groups: \(error)")
        }
    }

    func createTaskGroup(name: String) async throws {
        let apiService = APIService.shared
        let newGroup = try await apiService.createTaskGroup(name: name)
        self.taskGroups.append(newGroup)
    }

    func deleteTaskGroup(id: Int) async throws {
        let apiService = APIService.shared
        try await apiService.deleteTaskGroup(id: id)

        if let index = taskGroups.firstIndex(where: { $0.id == id }) {
            taskGroups.remove(at: index)
        }
    }

    // MARK: - Priorities

    func loadPriorities() async {
        guard isAuthenticated else { return }

        do {
            let apiService = APIService.shared
            self.priorities = try await apiService.getPriorities()
        } catch {
            print("Failed to load priorities: \(error)")
        }
    }

    func createPriority(name: String, color: Color) async throws {
        let apiService = APIService.shared
        let colorHex = color.toHex()
        let newPriority = try await apiService.createPriority(name: name, colorHex: colorHex)
        self.priorities.append(newPriority)
    }

    func deletePriority(id: Int) async throws {
        let apiService = APIService.shared
        try await apiService.deletePriority(id: id)

        if let index = priorities.firstIndex(where: { $0.id == id }) {
            priorities.remove(at: index)
        }
    }

    // MARK: - Task Creation Helper

    func createTask(
        title: String,
        description: String?,
        groupId: Int?,
        priorityId: Int?,
        status: TaskStatus,
        dueDate: Date?
    ) async throws {
        let apiService = APIService.shared
        let task = TaskItem(
            id: nil,
            title: title,
            description: description,
            status: status,
            dueDate: dueDate,
            groupId: groupId,
            priorityId: priorityId
        )
        let newTask = try await apiService.createTask(task)
        self.tasks.append(newTask)
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

// MARK: - Keychain Helper

struct KeychainHelper {
    private static let service = "com.hostprint.xover"
    private static let account = "authToken"

    static func saveToken(_ token: String) {
        let data = token.data(using: .utf8)!

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecValueData as String: data
        ]

        SecItemDelete(query as CFDictionary)
        SecItemAdd(query as CFDictionary, nil)
    }

    static func getToken() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess,
              let data = result as? Data,
              let token = String(data: data, encoding: .utf8) else {
            return nil
        }

        return token
    }

    static func deleteToken() {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]

        SecItemDelete(query as CFDictionary)
    }
}
