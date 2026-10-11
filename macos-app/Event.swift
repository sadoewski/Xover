//
//  Event.swift
//  Xover
//
//  Модель события
//

import Foundation
import SwiftUI

struct Event: Identifiable, Codable, Hashable {
    var id: Int
    var name: String
    var description: String?
    var date: Date
    var color: String?
    var createdAt: Date?
    var updatedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case description
        case date
        case color
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }

    var colorValue: Color {
        if let color = color {
            return Color(hex: color) ?? .blue
        }
        return .blue
    }
}
