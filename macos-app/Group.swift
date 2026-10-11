//
//  Group.swift
//  Xover
//
//  Модели групп и типов групп задач
//

import Foundation
import SwiftUI

// MARK: - Group

struct Group: Identifiable, Codable, Hashable {
    var id: Int
    var name: String
    var color: String
    var createdAt: Date?
    var updatedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case color
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }

    var colorValue: Color {
        Color(hex: color) ?? .blue
    }
}

// MARK: - Group Type

struct GroupType: Identifiable, Codable, Hashable {
    var id: Int
    var name: String
    var groupId: Int
    var createdAt: Date?
    var updatedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case groupId = "group_id"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}
