//
//  Template.swift
//  Xover
//
//  Модель шаблона задачи
//

import Foundation

struct TaskTemplate: Identifiable, Codable, Hashable {
    var id: Int
    var name: String
    var description: String?
    var defaultPriorityId: Int?
    var defaultGroupId: Int?
    var defaultGroupTypeId: Int?
    var checklistItems: [String]?
    var createdAt: Date?
    var updatedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case description
        case defaultPriorityId = "default_priority_id"
        case defaultGroupId = "default_group_id"
        case defaultGroupTypeId = "default_group_type_id"
        case checklistItems = "checklist_items"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}
