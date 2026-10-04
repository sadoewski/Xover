//
//  SyncManager.swift
//  Xover
//
//  Created by Claude Code
//  Manages offline sync, conflict resolution, and network operations
//

import Foundation
import Network
import Combine
import AppKit
import UserNotifications

// MARK: - Sync Models

// Using Data instead of [String: Any] for Codable compliance
enum SyncOperation: Codable {
    case create(data: Data)
    case update(id: String, data: Data)
    case delete(id: String)

    enum CodingKeys: String, CodingKey {
        case type, id, data
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        switch self {
        case .create(let data):
            try container.encode("create", forKey: .type)
            try container.encode(data, forKey: .data)
        case .update(let id, let data):
            try container.encode("update", forKey: .type)
            try container.encode(id, forKey: .id)
            try container.encode(data, forKey: .data)
        case .delete(let id):
            try container.encode("delete", forKey: .type)
            try container.encode(id, forKey: .id)
        }
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let type = try container.decode(String.self, forKey: .type)

        switch type {
        case "create":
            let data = try container.decode(Data.self, forKey: .data)
            self = .create(data: data)
        case "update":
            let id = try container.decode(String.self, forKey: .id)
            let data = try container.decode(Data.self, forKey: .data)
            self = .update(id: id, data: data)
        case "delete":
            let id = try container.decode(String.self, forKey: .id)
            self = .delete(id: id)
        default:
            throw DecodingError.dataCorruptedError(forKey: .type, in: container, debugDescription: "Invalid operation type")
        }
    }
}

struct QueuedOperation: Codable, Identifiable {
    let id: UUID
    let operation: SyncOperation
    let endpoint: String
    let timestamp: Date
    var retryCount: Int
    var nextRetryAt: Date?
    
    init(operation: SyncOperation, endpoint: String) {
        self.id = UUID()
        self.operation = operation
        self.endpoint = endpoint
        self.timestamp = Date()
        self.retryCount = 0
        self.nextRetryAt = nil
    }
}

enum SyncStatus: Equatable {
    case idle
    case syncing
    case error(String)
    case offline

    var description: String {
        switch self {
        case .idle: return "Synchronized"
        case .syncing: return "Syncing..."
        case .error(let msg): return "Error: \(msg)"
        case .offline: return "Offline - queued for sync"
        }
    }
}

struct ConflictResolution {
    let localTimestamp: Date
    let remoteTimestamp: Date
    let winner: ConflictWinner
    
    enum ConflictWinner {
        case local
        case remote
    }
    
    static func resolve(local: Date, remote: Date) -> ConflictResolution {
        let winner: ConflictWinner = local > remote ? .local : .remote
        return ConflictResolution(localTimestamp: local, remoteTimestamp: remote, winner: winner)
    }
}

// MARK: - Sync Manager

class SyncManager: ObservableObject {
    static let shared = SyncManager()
    
    // MARK: - Properties
    
    @Published private(set) var isOnline = true
    @Published private(set) var syncStatus: SyncStatus = .idle
    @Published private(set) var queuedOperationsCount = 0
    @Published var standaloneMode: Bool = false
    
    private let monitor = NWPathMonitor()
    private let monitorQueue = DispatchQueue(label: "com.xover.network.monitor")
    private var cancellables = Set<AnyCancellable>()
    
    private let operationQueue: OperationQueue = {
        let queue = OperationQueue()
        queue.maxConcurrentOperationCount = 1
        queue.qualityOfService = .userInitiated
        return queue
    }()
    
    private var queuedOperations: [QueuedOperation] = [] {
        didSet {
            queuedOperationsCount = queuedOperations.count
            saveQueue()
        }
    }
    
    private let baseURL: String
    private let maxRetries = 5
    private let initialBackoff: TimeInterval = 2.0
    
    // MARK: - Initialization
    
    init(baseURL: String = ProcessInfo.processInfo.environment["API_BASE_URL"] ?? "http://localhost:5000") {
        self.baseURL = baseURL
        self.standaloneMode = UserDefaults.standard.bool(forKey: "standaloneMode")
        loadQueue()
        setupNetworkMonitoring()
    }
    
    deinit {
        monitor.cancel()
    }
    
    // MARK: - Network Monitoring
    
    private func setupNetworkMonitoring() {
        monitor.pathUpdateHandler = { [weak self] path in
            DispatchQueue.main.async {
                let wasOnline = self?.isOnline ?? false
                self?.isOnline = path.status == .satisfied
                
                if !wasOnline && (self?.isOnline ?? false) {
                    self?.syncStatus = .idle
                    self?.processQueue()
                } else if !(self?.isOnline ?? true) {
                    self?.syncStatus = .offline
                }
            }
        }
        monitor.start(queue: monitorQueue)
    }
    
    // MARK: - Queue Management
    
    func enqueue(operation: SyncOperation, endpoint: String) {
        guard !standaloneMode else { return }

        let queued = QueuedOperation(operation: operation, endpoint: endpoint)
        queuedOperations.append(queued)

        if isOnline {
            processQueue()
        } else {
            syncStatus = .offline
            postNotification(title: "Operation Queued", message: "Will sync when online")
        }
    }
    
    private func processQueue() {
        guard isOnline, !queuedOperations.isEmpty else { return }
        guard syncStatus != .syncing else { return }
        
        syncStatus = .syncing
        
        let operations = queuedOperations.filter { operation in
            guard let nextRetry = operation.nextRetryAt else { return true }
            return Date() >= nextRetry
        }
        
        guard !operations.isEmpty else {
            syncStatus = .idle
            return
        }
        
        let group = DispatchGroup()
        var failedOperations: [QueuedOperation] = []
        
        for operation in operations {
            group.enter()
            executeOperation(operation) { [weak self] success in
                if !success {
                    failedOperations.append(operation)
                } else {
                    self?.removeFromQueue(operation)
                }
                group.leave()
            }
        }
        
        group.notify(queue: .main) { [weak self] in
            if failedOperations.isEmpty {
                self?.syncStatus = .idle
                self?.postNotification(title: "Sync Complete", message: "All changes synchronized")
            } else {
                self?.handleFailedOperations(failedOperations)
            }
        }
    }
    
    private func handleFailedOperations(_ operations: [QueuedOperation]) {
        for var operation in operations {
            operation.retryCount += 1
            
            if operation.retryCount >= maxRetries {
                syncStatus = .error("Max retries exceeded")
                postNotification(title: "Sync Failed", message: "Operation failed after \(maxRetries) attempts")
                removeFromQueue(operation)
            } else {
                let backoff = initialBackoff * pow(2.0, Double(operation.retryCount - 1))
                operation.nextRetryAt = Date().addingTimeInterval(backoff)
                updateQueue(operation)
                
                DispatchQueue.main.asyncAfter(deadline: .now() + backoff) { [weak self] in
                    self?.processQueue()
                }
            }
        }
    }
    
    private func removeFromQueue(_ operation: QueuedOperation) {
        queuedOperations.removeAll { $0.id == operation.id }
    }
    
    private func updateQueue(_ operation: QueuedOperation) {
        if let index = queuedOperations.firstIndex(where: { $0.id == operation.id }) {
            queuedOperations[index] = operation
        }
    }
    
    // MARK: - Operation Execution
    
    private func executeOperation(_ operation: QueuedOperation, completion: @escaping (Bool) -> Void) {
        let url = URL(string: "\(baseURL)\(operation.endpoint)")!
        var request = URLRequest(url: url)
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")

        switch operation.operation {
        case .create(let data):
            request.httpMethod = "POST"
            request.httpBody = data

        case .update(let id, let data):
            request.httpMethod = "PUT"
            // Merge id into data JSON
            if var json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                json["id"] = id
                request.httpBody = try? JSONSerialization.data(withJSONObject: json)
            } else {
                request.httpBody = data
            }

        case .delete(let id):
            request.httpMethod = "DELETE"
            request.url = URL(string: "\(baseURL)\(operation.endpoint)/\(id)")
        }
        
        URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            DispatchQueue.main.async {
                if let error = error {
                    print("Operation failed: \(error.localizedDescription)")
                    completion(false)
                    return
                }
                
                guard let httpResponse = response as? HTTPURLResponse else {
                    completion(false)
                    return
                }
                
                if (200...299).contains(httpResponse.statusCode) {
                    completion(true)
                } else if httpResponse.statusCode == 409 {
                    // Conflict - need resolution
                    self?.handleConflict(operation: operation, responseData: data) { resolved in
                        completion(resolved)
                    }
                } else {
                    completion(false)
                }
            }
        }.resume()
    }
    
    // MARK: - Conflict Resolution
    
    private func handleConflict(operation: QueuedOperation, responseData: Data?, completion: @escaping (Bool) -> Void) {
        guard let data = responseData,
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let remoteTimestampString = json["updatedAt"] as? String,
              let remoteTimestamp = ISO8601DateFormatter().date(from: remoteTimestampString) else {
            completion(false)
            return
        }
        
        let localTimestamp = operation.timestamp
        let resolution = ConflictResolution.resolve(local: localTimestamp, remote: remoteTimestamp)
        
        switch resolution.winner {
        case .local:
            // Force update with our version
            var newOperation = operation
            if case .update(let id, let data) = operation.operation {
                if var json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                    json["forceUpdate"] = true
                    if let updatedData = try? JSONSerialization.data(withJSONObject: json) {
                        newOperation = QueuedOperation(operation: .update(id: id, data: updatedData), endpoint: operation.endpoint)
                    }
                }
            }
            executeOperation(newOperation, completion: completion)
            
        case .remote:
            // Remote is newer, drop our change
            postNotification(title: "Conflict Resolved", message: "Remote version is newer")
            completion(true)
        }
    }
    
    // MARK: - Public API
    
    func sync() {
        guard !standaloneMode else { return }
        guard isOnline else {
            postNotification(title: "Offline", message: "Cannot sync while offline")
            return
        }
        processQueue()
    }
    
    func clearQueue() {
        queuedOperations.removeAll()
        syncStatus = .idle
        postNotification(title: "Queue Cleared", message: "All pending operations removed")
    }
    
    func retryNow() {
        for i in 0..<queuedOperations.count {
            queuedOperations[i].nextRetryAt = nil
        }
        processQueue()
    }

    func setStandaloneMode(_ enabled: Bool) {
        standaloneMode = enabled
        UserDefaults.standard.set(enabled, forKey: "standaloneMode")

        if enabled {
            // Clear all queued operations when entering standalone mode
            queuedOperations.removeAll()
            syncStatus = .idle
        }
    }
    
    // MARK: - Persistence
    
    private func saveQueue() {
        let encoder = JSONEncoder()
        if let encoded = try? encoder.encode(queuedOperations) {
            UserDefaults.standard.set(encoded, forKey: "syncQueue")
        }
    }
    
    private func loadQueue() {
        guard let data = UserDefaults.standard.data(forKey: "syncQueue"),
              let decoded = try? JSONDecoder().decode([QueuedOperation].self, from: data) else {
            return
        }
        queuedOperations = decoded
    }
    
    // MARK: - Notifications
    
    private func postNotification(title: String, message: String) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = message
        content.sound = .default
        
        let request = UNNotificationRequest(
            identifier: UUID().uuidString,
            content: content,
            trigger: nil
        )
        
        UNUserNotificationCenter.current().add(request)
    }
}

// MARK: - SwiftUI Integration

extension SyncManager {
    var statusColor: NSColor {
        switch syncStatus {
        case .idle: return .systemGreen
        case .syncing: return .systemBlue
        case .error: return .systemRed
        case .offline: return .systemOrange
        }
    }
    
    var statusIcon: String {
        switch syncStatus {
        case .idle: return "checkmark.circle.fill"
        case .syncing: return "arrow.triangle.2.circlepath"
        case .error: return "exclamationmark.triangle.fill"
        case .offline: return "wifi.slash"
        }
    }
}
