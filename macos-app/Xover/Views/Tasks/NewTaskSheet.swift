//
//  NewTaskSheet.swift
//  Xover
//
//  Форма создания новой задачи
//

import SwiftUI

struct NewTaskSheet: View {
    @EnvironmentObject var appState: AppState
    @Binding var isPresented: Bool

    @State private var title = ""
    @State private var description = ""
    @State private var selectedGroup: TaskGroupModel?
    @State private var selectedPriority: Priority?
    @State private var selectedStatus: TaskStatus = .todo
    @State private var dueDate: Date?
    @State private var hasDueDate = false
    @State private var isLoading = false
    @State private var errorMessage: String?

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text("New Task")
                    .font(.title2)
                    .fontWeight(.bold)

                Spacer()

                Button("Cancel") {
                    isPresented = false
                }
                .keyboardShortcut(.escape)
            }
            .padding()

            Divider()

            // Form
            Form {
                Section("Basic Information") {
                    TextField("Title", text: $title)

                    TextField("Description", text: $description, axis: .vertical)
                        .lineLimit(3...6)
                }

                Section("Organization") {
                    Picker("Group", selection: $selectedGroup) {
                        Text("None").tag(nil as TaskGroup?)
                        ForEach(appState.taskGroups) { group in
                            Text(group.name).tag(group as TaskGroup?)
                        }
                    }

                    Picker("Priority", selection: $selectedPriority) {
                        Text("None").tag(nil as Priority?)
                        ForEach(appState.priorities) { priority in
                            HStack {
                                Circle()
                                    .fill(priority.color)
                                    .frame(width: 8, height: 8)
                                Text(priority.name)
                            }
                            .tag(priority as Priority?)
                        }
                    }

                    Picker("Status", selection: $selectedStatus) {
                        ForEach(TaskStatus.allCases, id: \.self) { status in
                            Text(status.displayName).tag(status)
                        }
                    }
                }

                Section("Due Date") {
                    Toggle("Set due date", isOn: $hasDueDate)

                    if hasDueDate {
                        DatePicker("Due date", selection: Binding(
                            get: { dueDate ?? Date() },
                            set: { dueDate = $0 }
                        ), displayedComponents: [.date, .hourAndMinute])
                    }
                }
            }
            .formStyle(.grouped)

            if let error = errorMessage {
                Text(error)
                    .foregroundColor(.red)
                    .font(.caption)
                    .padding()
            }

            Divider()

            // Footer
            HStack {
                Spacer()

                Button("Create Task") {
                    Task {
                        await createTask()
                    }
                }
                .buttonStyle(.borderedProminent)
                .disabled(title.isEmpty || isLoading)
                .keyboardShortcut(.return, modifiers: .command)
            }
            .padding()
        }
        .frame(width: 600, height: 650)
        .task {
            if appState.taskGroups.isEmpty {
                await appState.loadTaskGroups()
            }
            if appState.priorities.isEmpty {
                await appState.loadPriorities()
            }
        }
    }

    private func createTask() async {
        isLoading = true
        errorMessage = nil

        do {
            try await appState.createTask(
                title: title,
                description: description.isEmpty ? nil : description,
                groupId: selectedGroup?.id,
                priorityId: selectedPriority?.id,
                status: selectedStatus,
                dueDate: hasDueDate ? dueDate : nil
            )

            isPresented = false
        } catch {
            errorMessage = "Failed to create task: \(error.localizedDescription)"
        }

        isLoading = false
    }
}

#Preview {
    NewTaskSheet(isPresented: .constant(true))
        .environmentObject(AppState())
}
