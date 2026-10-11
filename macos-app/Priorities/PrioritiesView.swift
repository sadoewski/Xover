//
//  PrioritiesView.swift
//  Xover
//
//  Управление приоритетами
//

import SwiftUI

struct PrioritiesView: View {
    @EnvironmentObject var appState: AppState
    @State private var showingCreatePriority = false
    @State private var newPriorityName = ""
    @State private var newPriorityColor = Color.blue
    @State private var errorMessage: String?

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text("Приоритеты")
                    .font(.title)
                    .fontWeight(.bold)

                Spacer()

                Button {
                    showingCreatePriority = true
                } label: {
                    Label("Добавить приоритет", systemImage: "plus")
                }
                .buttonStyle(.borderedProminent)
            }
            .padding()

            Divider()

            // List
            if appState.priorities.isEmpty {
                ContentUnavailableView(
                    "Нет приоритетов",
                    systemImage: "star",
                    description: Text("Создайте приоритеты для задач")
                )
            } else {
                List {
                    ForEach(appState.priorities) { priority in
                        PriorityRow(priority: priority)
                            .contextMenu {
                                Button(role: .destructive) {
                                    deletePriority(priority)
                                } label: {
                                    Label("Удалить", systemImage: "trash")
                                }
                            }
                    }
                }
            }
        }
        .sheet(isPresented: $showingCreatePriority) {
            CreatePrioritySheet(
                name: $newPriorityName,
                color: $newPriorityColor,
                onSave: createPriority,
                onCancel: {
                    showingCreatePriority = false
                    newPriorityName = ""
                    newPriorityColor = .blue
                }
            )
        }
        .task {
            await appState.loadPriorities()
        }
        .alert("Ошибка", isPresented: .constant(errorMessage != nil)) {
            Button("OK") {
                errorMessage = nil
            }
        } message: {
            if let error = errorMessage {
                Text(error)
            }
        }
    }

    // MARK: - Actions

    private func createPriority() {
        Task {
            do {
                try await appState.createPriority(name: newPriorityName, color: newPriorityColor)
                showingCreatePriority = false
                newPriorityName = ""
                newPriorityColor = .blue
            } catch {
                errorMessage = "Не удалось создать приоритет: \(error.localizedDescription)"
            }
        }
    }

    private func deletePriority(_ priority: Priority) {
        Task {
            do {
                try await appState.deletePriority(id: priority.id)
            } catch {
                errorMessage = "Не удалось удалить приоритет: \(error.localizedDescription)"
            }
        }
    }
}

// MARK: - Priority Row

struct PriorityRow: View {
    let priority: Priority

    var body: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(priority.color)
                .frame(width: 24, height: 24)

            Text(priority.name)
                .font(.body)

            Spacer()
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Create Priority Sheet

struct CreatePrioritySheet: View {
    @Binding var name: String
    @Binding var color: Color
    let onSave: () -> Void
    let onCancel: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("Новый приоритет")
                .font(.title2)
                .fontWeight(.semibold)

            VStack(alignment: .leading, spacing: 8) {
                Text("Название")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                TextField("Название приоритета", text: $name)
                    .textFieldStyle(.roundedBorder)
            }

            VStack(alignment: .leading, spacing: 8) {
                Text("Цвет")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                ColorPicker("Выберите цвет", selection: $color, supportsOpacity: false)
            }

            HStack {
                Button("Отмена", action: onCancel)
                    .keyboardShortcut(.cancelAction)

                Spacer()

                Button("Создать", action: onSave)
                    .buttonStyle(.borderedProminent)
                    .keyboardShortcut(.defaultAction)
                    .disabled(name.isEmpty)
            }
        }
        .padding(24)
        .frame(width: 400)
    }
}

#Preview {
    PrioritiesView()
        .environmentObject(AppState())
        .frame(width: 800, height: 600)
}
