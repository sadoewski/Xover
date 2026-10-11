//
//  DashboardView.swift
//  Xover
//
//  Dashboard с обзором задач
//

import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                // Header
                VStack(alignment: .leading, spacing: 8) {
                    Text("Панель управления")
                        .font(.system(size: 32, weight: .bold))

                    Text("С возвращением, \(appState.currentUser?.displayName ?? "Пользователь")!")
                        .font(.title3)
                        .foregroundColor(.secondary)
                }
                .padding(.horizontal, 32)
                .padding(.top, 24)

                // Statistics Cards
                HStack(spacing: 16) {
                    StatCard(
                        title: "Всего задач",
                        value: "\(appState.tasks.count)",
                        icon: "checklist",
                        color: .blue
                    )

                    StatCard(
                        title: "В работе",
                        value: "\(appState.tasks.filter { $0.status == .inProgress }.count)",
                        icon: "circle.lefthalf.filled",
                        color: .orange
                    )

                    StatCard(
                        title: "Завершено",
                        value: "\(appState.tasks.filter { $0.status == .done }.count)",
                        icon: "checkmark.circle.fill",
                        color: .green
                    )

                    StatCard(
                        title: "К выполнению",
                        value: "\(appState.tasks.filter { $0.status == .todo }.count)",
                        icon: "circle",
                        color: .gray
                    )
                }
                .padding(.horizontal, 32)

                // Recent Tasks
                VStack(alignment: .leading, spacing: 12) {
                    Text("Последние задачи")
                        .font(.title2.bold())

                    if appState.tasks.isEmpty {
                        Text("Пока нет задач")
                            .foregroundColor(.secondary)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 40)
                    } else {
                        ForEach(appState.tasks.prefix(5)) { task in
                            TaskRowView(task: task)
                        }
                    }
                }
                .padding(.horizontal, 32)
                .padding(.bottom, 24)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(Color(NSColor.windowBackgroundColor))
    }
}

// MARK: - Stat Card

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(color)
                Spacer()
            }

            Text(value)
                .font(.system(size: 32, weight: .bold))

            Text(title)
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(NSColor.controlBackgroundColor))
        .cornerRadius(12)
    }
}

// MARK: - TaskItem Row

struct TaskRowView: View {
    let task: TaskItem

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: task.status.icon)
                .foregroundColor(colorForStatus(task.status))

            VStack(alignment: .leading, spacing: 4) {
                Text(task.title)
                    .font(.headline)

                if let description = task.description {
                    Text(description)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }
            }

            Spacer()

            Text(task.status.displayName)
                .font(.caption)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(colorForStatus(task.status).opacity(0.2))
                .foregroundColor(colorForStatus(task.status))
                .cornerRadius(6)
        }
        .padding(12)
        .background(Color(NSColor.controlBackgroundColor))
        .cornerRadius(8)
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

#Preview {
    DashboardView()
        .environmentObject(AppState())
        .frame(width: 1000, height: 800)
}
