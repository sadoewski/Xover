//
//  APIClient.swift
//  Xover
//
//  Основной клиент для работы с API
//

import Foundation
import Combine

class APIClient: ObservableObject {
    static let shared = APIClient()

    @Published var isAuthenticated = false

    private var baseURL: URL
    private var authToken: String?
    private let decoder: JSONDecoder

    init(baseURL: String = "http://localhost:5001") {
        self.baseURL = URL(string: baseURL)!

        // Настройка decoder для работы с датами
        self.decoder = JSONDecoder()
        self.decoder.dateDecodingStrategy = .iso8601

        // Попытка загрузить токен из Keychain
        loadToken()
    }

    // MARK: - Authentication

    func login(username: String, password: String) async throws -> User {
        let endpoint = "/api/auth/login"
        let body: [String: Any] = ["username": username, "password": password]

        let response: LoginResponse = try await request(
            endpoint: endpoint,
            method: "POST",
            body: body
        )

        // Сохранить токен
        try KeychainHelper.save(token: response.token)
        self.authToken = response.token

        await MainActor.run {
            self.isAuthenticated = true
        }

        return response.user
    }

    func logout() {
        KeychainHelper.deleteToken()
        authToken = nil
        isAuthenticated = false
    }

    // MARK: - Tasks API

    func fetchTasks() async throws -> [TaskItem] {
        return try await request(endpoint: "/api/tasks", method: "GET")
    }

    func createTask(_ task: TaskItem) async throws -> TaskItem {
        return try await request(
            endpoint: "/api/tasks",
            method: "POST",
            body: task.asDictionary()
        )
    }

    func updateTask(_ task: TaskItem) async throws -> TaskItem {
        guard let id = task.id else {
            throw APIError.invalidRequest
        }

        return try await request(
            endpoint: "/api/tasks/\(id)",
            method: "PUT",
            body: task.asDictionary()
        )
    }

    func deleteTask(id: Int) async throws {
        let _: EmptyResponse = try await request(
            endpoint: "/api/tasks/\(id)",
            method: "DELETE"
        )
    }

    // MARK: - Generic Request

    private func request<T: Decodable>(
        endpoint: String,
        method: String,
        body: [String: Any]? = nil
    ) async throws -> T {
        var request = URLRequest(url: baseURL.appendingPathComponent(endpoint))
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        // Добавить токен если есть
        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        // Добавить body если есть
        if let body = body {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
        }

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        switch httpResponse.statusCode {
        case 200...299:
            if T.self == EmptyResponse.self {
                return EmptyResponse() as! T
            }
            return try decoder.decode(T.self, from: data)
        case 401:
            throw APIError.unauthorized
        case 404:
            throw APIError.notFound
        default:
            throw APIError.serverError(httpResponse.statusCode)
        }
    }

    private func loadToken() {
        if let token = KeychainHelper.loadToken() {
            self.authToken = token
            self.isAuthenticated = true
        }
    }
}

// MARK: - API Error

enum APIError: LocalizedError {
    case invalidRequest
    case invalidResponse
    case unauthorized
    case notFound
    case serverError(Int)
    case decodingError

    var errorDescription: String? {
        switch self {
        case .invalidRequest:
            return "Invalid request"
        case .invalidResponse:
            return "Invalid server response"
        case .unauthorized:
            return "Unauthorized - please login again"
        case .notFound:
            return "Resource not found"
        case .serverError(let code):
            return "Server error: \(code)"
        case .decodingError:
            return "Failed to decode response"
        }
    }
}

// MARK: - Helper Types

struct EmptyResponse: Codable {}

// Extension для преобразования Task в Dictionary
extension Task {
    func asDictionary() -> [String: Any] {
        var dict: [String: Any] = [
            "title": title,
            "status": status.rawValue
        ]

        if let description = description {
            dict["description"] = description
        }

        if let priority = priority {
            dict["priorityId"] = priority.id
        }

        if let groupId = groupId {
            dict["groupId"] = groupId
        }

        if let userId = userId {
            dict["userId"] = userId
        }

        if let dueDate = dueDate {
            let formatter = ISO8601DateFormatter()
            dict["dueDate"] = formatter.string(from: dueDate)
        }

        return dict
    }
}
