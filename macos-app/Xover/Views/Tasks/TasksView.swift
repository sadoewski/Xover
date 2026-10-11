//
//  TasksView.swift
//  Xover
//
//  Список задач с детальным просмотром
//

import SwiftUI

struct TasksView: View {
    @EnvironmentObject var appState: AppState
    @State private var selectedTask: TaskItem?
    @State private var searchText = ""
    @State private var filterStatus: TaskStatus?
    @State private var showingNewTaskSheet = false
    @State private var showingGroupsSheet = false
    @State private var showingPrioritiesSheet = false

    var filteredTasks: [TaskItem] {
        var tasks = appState.tasks

        if !searchText.isEmpty {
            tasks = tasks.filter { task in
                task.title.localizedCaseInsensitiveContains(searchText) ||
                (task.description?.localizedCaseInsensitiveContains(searchText) ?? false)
            }
        }

        if let status = filterStatus {
            tasks = tasks.filter { $0.status == status }
        }

        return tasks
    }

    var body: some View {
        NavigationSplitView {
            // TaskItem List
            VStack(spacing: 0) {
                // Search and Filter
                VStack(spacing: 12) {
                    TextField("Search tasks...", text: $searchText)
                        .textFieldStyle(.roundedBorder)

                    Picker("Filter", selection: $filterStatus) {
                        Text("All").tag(nil as TaskStatus?)
                        ForEach(TaskStatus.allCases, id: \.self) { status in
                            Text(status.displayName).tag(status as TaskStatus?)
                        }
                    }
                    .pickerStyle(.segmented)
                }
                .padding()

                Divider()

                // TaskItem List
                List(filteredTasks, selection: $selectedTask) { task in
                    TaskListRow(task: task)
                        .tag(task)
                }
                .listStyle(.sidebar)
            }
            .navigationTitle("Задачи")
            .navigationSplitViewColumnWidth(min: 300, ideal: 350, max: 500)
            .toolbar {
                ToolbarItem(placement: .automatic) {
                    Menu {
                        Button(action: { showingNewTaskSheet = true }) {
                            Label("Новая задача", systemImage: "plus")
                        }

                        Divider()

                        Button(action: { showingGroupsSheet = true }) {
                            Label("Управление группами", systemImage: "folder")
                        }

                        Button(action: { showingPrioritiesSheet = true }) {
                            Label("Управление приоритетами", systemImage: "flag")
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }

                ToolbarItem(placement: .automatic) {
                    Button(action: { showingNewTaskSheet = true }) {
                        Image(systemName: "plus")
                    }
                }
            }
        } detail: {
            // TaskItem Detail
            if let task = selectedTask {
                TaskDetailView(task: task)
                    .environmentObject(appState)
            } else {
                EmptyStateView(
                    "Выберите задачу",
                    systemImage: "checklist",
                    description: "Выберите задачу из списка для просмотра деталей"
                )
            }
        }
        .sheet(isPresented: $showingNewTaskSheet) {
            NewTaskSheet(isPresented: $showingNewTaskSheet)
                .environmentObject(appState)
        }
        .sheet(isPresented: $showingGroupsSheet) {
            TaskGroupsSheet(isPresented: $showingGroupsSheet)
                .environmentObject(appState)
        }
        .sheet(isPresented: $showingPrioritiesSheet) {
            PrioritiesSheet(isPresented: $showingPrioritiesSheet)
                .environmentObject(appState)
        }
    }
}

// MARK: - TaskItem List Row

struct TaskListRow: View {
    let task: TaskItem

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: task.status.icon)
                .foregroundColor(colorForStatus(task.status))
                .frame(width: 20)

            VStack(alignment: .leading, spacing: 4) {
                Text(task.title)
                    .font(.headline)

                if let description = task.description {
                    Text(description)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }

                if let dueDate = task.dueDate {
                    Text(dueDate, style: .date)
                        .font(.caption2)
                        .foregroundColor(.orange)
                }
            }

            Spacer()
        }
        .padding(.vertical, 4)
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
    TasksView()
        .environmentObject(AppState())
        .frame(width: 1200, height: 800)
}

// MARK: - New Task Sheet

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
                Text("Новая задача")
                    .font(.title2)
                    .fontWeight(.bold)

                Spacer()

                Button("Отмена") {
                    isPresented = false
                }
                .keyboardShortcut(.escape)
            }
            .padding()

            Divider()

            // Form
            Form {
                Section("Основная информация") {
                    TextField("Название", text: $title)

                    TextField("Описание", text: $description, axis: .vertical)
                        .lineLimit(3...6)
                }

                Section("Организация") {
                    Picker("Группа", selection: $selectedGroup) {
                        Text("Не выбрана").tag(nil as TaskGroupModel?)
                        ForEach(appState.taskGroups) { group in
                            Text(group.name).tag(group as TaskGroupModel?)
                        }
                    }

                    Picker("Приоритет", selection: $selectedPriority) {
                        Text("Не выбран").tag(nil as Priority?)
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

                    Picker("Статус", selection: $selectedStatus) {
                        ForEach(TaskStatus.allCases, id: \.self) { status in
                            Text(status.displayName).tag(status)
                        }
                    }
                }

                Section("Срок выполнения") {
                    Toggle("Установить срок", isOn: $hasDueDate)

                    if hasDueDate {
                        DatePicker("Срок выполнения", selection: Binding(
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

// MARK: - Task Groups Sheet

struct TaskGroupsSheet: View {
    @EnvironmentObject var appState: AppState
    @Binding var isPresented: Bool
    @State private var newGroupName = ""
    @State private var isCreating = false

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text("Task Groups")
                    .font(.title2)
                    .fontWeight(.bold)

                Spacer()

                Button("Done") {
                    isPresented = false
                }
                .keyboardShortcut(.return, modifiers: .command)
            }
            .padding()

            Divider()

            // Create new group
            HStack {
                TextField("New group name", text: $newGroupName)
                    .textFieldStyle(.roundedBorder)

                Button("Add") {
                    Task {
                        await createGroup()
                    }
                }
                .buttonStyle(.borderedProminent)
                .disabled(newGroupName.isEmpty || isCreating)
            }
            .padding()

            Divider()

            // Groups list
            List {
                ForEach(appState.taskGroups) { group in
                    HStack {
                        Text(group.name)

                        Spacer()

                        Button(action: {
                            Task {
                                await deleteGroup(group)
                            }
                        }) {
                            Image(systemName: "trash")
                                .foregroundColor(.red)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
        .frame(width: 500, height: 400)
        .task {
            await appState.loadTaskGroups()
        }
    }

    private func createGroup() async {
        isCreating = true

        do {
            try await appState.createTaskGroup(name: newGroupName)
            newGroupName = ""
        } catch {
            print("Failed to create group: \(error)")
        }

        isCreating = false
    }

    private func deleteGroup(_ group: TaskGroupModel) async {
        do {
            try await appState.deleteTaskGroup(id: group.id)
        } catch {
            print("Failed to delete group: \(error)")
        }
    }
}

// MARK: - Priorities Sheet

struct PrioritiesSheet: View {
    @EnvironmentObject var appState: AppState
    @Binding var isPresented: Bool
    @State private var newPriorityName = ""
    @State private var newPriorityColor = Color.blue
    @State private var isCreating = false

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text("Priorities")
                    .font(.title2)
                    .fontWeight(.bold)

                Spacer()

                Button("Done") {
                    isPresented = false
                }
                .keyboardShortcut(.return, modifiers: .command)
            }
            .padding()

            Divider()

            // Create new priority
            HStack {
                TextField("New priority name", text: $newPriorityName)
                    .textFieldStyle(.roundedBorder)

                ColorPicker("", selection: $newPriorityColor)
                    .labelsHidden()

                Button("Add") {
                    Task {
                        await createPriority()
                    }
                }
                .buttonStyle(.borderedProminent)
                .disabled(newPriorityName.isEmpty || isCreating)
            }
            .padding()

            Divider()

            // Priorities list
            List {
                ForEach(appState.priorities) { priority in
                    HStack {
                        Circle()
                            .fill(priority.color)
                            .frame(width: 12, height: 12)

                        Text(priority.name)

                        Spacer()

                        Button(action: {
                            Task {
                                await deletePriority(priority)
                            }
                        }) {
                            Image(systemName: "trash")
                                .foregroundColor(.red)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
        .frame(width: 500, height: 400)
        .task {
            await appState.loadPriorities()
        }
    }

    private func createPriority() async {
        isCreating = true

        do {
            try await appState.createPriority(name: newPriorityName, color: newPriorityColor)
            newPriorityName = ""
            newPriorityColor = .blue
        } catch {
            print("Не удалось создать приоритет: \(error)")
        }

        isCreating = false
    }

    private func deletePriority(_ priority: Priority) async {
        do {
            try await appState.deletePriority(id: priority.id)
        } catch {
            print("Не удалось удалить приоритет: \(error)")
        }
    }
}
