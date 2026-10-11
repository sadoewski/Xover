//
//  Task.swift
//  Xover
//
//  Модель задачи для нативного интерфейса
//

import Foundation
import SwiftUI

struct TaskItem: Identifiable, Codable, Hashable {
    var id: Int?
    var title: String
    var description: String?
    var status: TaskStatus
    var priorityId: Int?
    var groupId: Int?
    var userId: Int?
    var dueDate: Date?
    var createdAt: Date?
    var updatedAt: Date?
    var checklist: [ChecklistItem]?
    var links: [TaskItemLink]?

    enum CodingKeys: String, CodingKey {
        case id
        case title
        case description
        case status
        case priorityId = "priority_id"
        case groupId = "group_id"
        case userId = "user_id"
        case dueDate = "due_date"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case checklist
        case links
    }

    // Для создания новой задачи
    init(
        id: Int? = nil,
        title: String,
        description: String? = nil,
        status: TaskStatus = .todo,
        dueDate: Date? = nil,
        groupId: Int? = nil,
        priorityId: Int? = nil
    ) {
        self.id = id
        self.title = title
        self.description = description
        self.status = status
        self.dueDate = dueDate
        self.groupId = groupId
        self.priorityId = priorityId
    }
}

// MARK: - Task Status

enum TaskStatus: String, Codable, CaseIterable {
    case todo = "TODO"
    case inProgress = "IN_PROGRESS"
    case done = "DONE"
    case cancelled = "CANCELLED"

    var displayName: String {
        switch self {
        case .todo: return "To Do"
        case .inProgress: return "In Progress"
        case .done: return "Done"
        case .cancelled: return "Cancelled"
        }
    }

    var icon: String {
        switch self {
        case .todo: return "circle"
        case .inProgress: return "circle.lefthalf.filled"
        case .done: return "checkmark.circle.fill"
        case .cancelled: return "xmark.circle"
        }
    }
}

// MARK: - Task Group

struct TaskGroupModel: Identifiable, Codable, Hashable {
    var id: Int
    var name: String
    var createdAt: Date?
    var updatedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - Priority

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

// MARK: - Checklist Item

struct ChecklistItem: Identifiable, Codable, Hashable {
    var id: Int?
    var text: String
    var completed: Bool
    var order: Int?
}

// MARK: - Task Link

struct TaskItemLink: Identifiable, Codable, Hashable {
    var id: Int?
    var taskId: Int
    var linkedTaskId: Int
    var linkType: String
}
