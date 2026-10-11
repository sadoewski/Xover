//
//  TaskDetailView.swift
//  Xover
//
//  Детальный просмотр задачи
//

import SwiftUI

struct TaskDetailView: View {
    let task: TaskItem
    @EnvironmentObject var appState: AppState
    @State private var isEditing = false

    private var priority: Priority? {
        guard let priorityId = task.priorityId else { return nil }
        return appState.priorities.first(where: { $0.id == priorityId })
    }

    private var group: TaskGroupModel? {
        guard let groupId = task.groupId else { return nil }
        return appState.taskGroups.first(where: { $0.id == groupId })
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                // Header
                HStack {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Image(systemName: task.status.icon)
                                .font(.title2)
                                .foregroundColor(colorForStatus(task.status))

                            Text(task.title)
                                .font(.largeTitle.bold())
                        }

                        if let description = task.description {
                            Text(description)
                                .font(.body)
                                .foregroundColor(.secondary)
                        }
                    }

                    Spacer()

                    Button(action: { isEditing.toggle() }) {
                        Text(isEditing ? "Done" : "Edit")
                    }
                    .buttonStyle(.bordered)
                }

                Divider()

                // Info Section
                VStack(alignment: .leading, spacing: 16) {
                    InfoRow(label: "Status", value: task.status.displayName)

                    if let priority = priority {
                        HStack {
                            Text("Priority")
                                .font(.headline)
                                .foregroundColor(.secondary)
                                .frame(width: 100, alignment: .leading)

                            HStack(spacing: 8) {
                                Circle()
                                    .fill(priority.color)
                                    .frame(width: 12, height: 12)
                                Text(priority.name)
                                    .font(.body)
                            }
                        }
                    }

                    if let group = group {
                        InfoRow(label: "Group", value: group.name)
                    }

                    if let dueDate = task.dueDate {
                        InfoRow(label: "Due Date", value: dueDate.formatted(date: .long, time: .omitted))
                    }

                    if let createdAt = task.createdAt {
                        InfoRow(label: "Created", value: createdAt.formatted(date: .long, time: .shortened))
                    }

                    if let updatedAt = task.updatedAt {
                        InfoRow(label: "Updated", value: updatedAt.formatted(date: .long, time: .shortened))
                    }
                }

                // Checklist
                if let checklist = task.checklist, !checklist.isEmpty {
                    Divider()

                    VStack(alignment: .leading, spacing: 12) {
                        Text("Checklist")
                            .font(.title2.bold())

                        ForEach(checklist) { item in
                            HStack(spacing: 12) {
                                Image(systemName: item.completed ? "checkmark.circle.fill" : "circle")
                                    .foregroundColor(item.completed ? .green : .gray)

                                Text(item.text)
                                    .strikethrough(item.completed)
                                    .foregroundColor(item.completed ? .secondary : .primary)
                            }
                        }
                    }
                }
            }
            .padding(32)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(Color(NSColor.windowBackgroundColor))
    }

    private func colorForStatus(_ status: TaskStatus) -> Color {
        switch status {
        case .todo: return .gray
        case .inProgress: return .orange
        case .done: return .green
        case .cancelled: return .red
        }
    }
}

// MARK: - Info Row

struct InfoRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label)
                .font(.headline)
                .foregroundColor(.secondary)
                .frame(width: 100, alignment: .leading)

            Text(value)
                .font(.body)
        }
    }
}

#Preview {
    TaskDetailView(task: TaskItem(
        title: "Sample Task",
        description: "This is a sample task description",
        status: .inProgress
    ))
    .environmentObject(AppState())
    .frame(width: 800, height: 600)
}
