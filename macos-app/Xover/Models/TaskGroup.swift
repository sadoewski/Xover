//
//  TaskGroup.swift
//  Xover
//
//  Модель группы задач
//

import Foundation

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
