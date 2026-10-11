//
//  Event.swift
//  Xover
//
//  Модель события
//

import Foundation
import SwiftUI

enum EventType: String, Codable, CaseIterable {
    case birthday = "birthday"
    case holiday = "holiday"
    case other = "other"

    var displayName: String {
        switch self {
        case .birthday: return "День рождения"
        case .holiday: return "Праздник"
        case .other: return "Другое"
        }
    }
}

struct Event: Identifiable, Codable, Hashable {
    var id: Int
    var type: String  // БД использует 'type', не 'event_type'
    var name: String
    var description: String?
    var date: Date
    var month: Int?
    var day: Int?
    var isDayOff: Bool
    var isYearly: Bool?
    var color: String?
    var createdAt: Date?
    var updatedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id
        case type
        case name
        case description
        case date
        case month
        case day
        case isDayOff = "is_day_off"
        case isYearly = "is_yearly"
        case color
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }

    var eventType: EventType {
        EventType(rawValue: type) ?? .other
    }

    var colorValue: Color {
        if let color = color {
            return Color(hex: color) ?? .blue
        }
        return .blue
    }
}
