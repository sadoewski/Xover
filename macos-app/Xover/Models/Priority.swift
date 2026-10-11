//
//  Priority.swift
//  Xover
//
//  Модель приоритета задач
//

import SwiftUI

struct Priority: Identifiable, Codable, Hashable {
    var id: Int
    var name: String
    var colorHex: String
    var createdAt: Date?
    var updatedAt: Date?

    var color: Color {
        Color(hex: colorHex) ?? .blue
    }

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case colorHex = "color_hex"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}
