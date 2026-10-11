//
//  User.swift
//  Xover
//
//  Модель пользователя
//

import Foundation

struct User: Identifiable, Codable {
    var id: Int
    var username: String
    var email: String?
    var name: String?
    var avatarUrl: String?
    var createdAt: Date?

    enum CodingKeys: String, CodingKey {
        case id, username, email, name
        case avatarUrl = "avatar_url"
        case createdAt = "created_at"
    }

    var displayName: String {
        return name ?? username
    }
}

// MARK: - Login Response

struct LoginResponse: Codable {
    var token: String
    var user: User
}
