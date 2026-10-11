//
//  GroupsView.swift
//  Xover
//
//  Управление группами записей и их типами
//

import SwiftUI

struct GroupsView: View {
    @EnvironmentObject var appState: AppState
    @State private var groups: [Group] = []
    @State private var groupTypes: [GroupType] = []
    @State private var selectedGroup: Group?
    @State private var isLoading = false
    @State private var showingCreateGroup = false
    @State private var showingCreateType = false
    @State private var newGroupName = ""
    @State private var newGroupColor = Color.blue
    @State private var newTypeName = ""
    @State private var errorMessage: String?

    var body: some View {
        NavigationSplitView {
            // Список групп
            List(selection: $selectedGroup) {
                Section("Группы") {
                    ForEach(groups) { group in
                        GroupRow(group: group)
                            .tag(group)
                            .contextMenu {
                                Button(role: .destructive) {
                                    deleteGroup(group)
                                } label: {
                                    Label("Удалить", systemImage: "trash")
                                }
                            }
                    }
                }
            }
            .navigationTitle("Группы")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        showingCreateGroup = true
                    } label: {
                        Label("Добавить группу", systemImage: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingCreateGroup) {
                CreateGroupSheet(
                    name: $newGroupName,
                    color: $newGroupColor,
                    onSave: createGroup,
                    onCancel: {
                        showingCreateGroup = false
                        newGroupName = ""
                        newGroupColor = .blue
                    }
                )
            }
        } detail: {
            // Детали группы с типами
            if let group = selectedGroup {
                GroupDetailView(
                    group: group,
                    types: group.types ?? [],
                    onCreateType: { name in
                        createGroupType(name: name, groupId: group.id)
                    },
                    onDeleteType: deleteGroupType
                )
            } else {
                EmptyStateView(
                    "Выберите группу",
                    systemImage: "folder",
                    description: "Выберите группу из списка, чтобы просмотреть её типы"
                )
            }
        }
        .task {
            await loadData()
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

    // MARK: - Data Loading

    private func loadData() async {
        isLoading = true
        defer { isLoading = false }

        do {
            async let groupsTask = APIService.shared.getGroups()
            async let typesTask = APIService.shared.getGroupTypes()

            groups = try await groupsTask
            groupTypes = try await typesTask
        } catch {
            errorMessage = "Не удалось загрузить данные: \(error.localizedDescription)"
        }
    }

    // MARK: - Actions

    private func createGroup() {
        Task {
            do {
                let hexColor = newGroupColor.toHex()
                let newGroup = try await APIService.shared.createGroup(name: newGroupName, color: hexColor)
                groups.append(newGroup)
                showingCreateGroup = false
                newGroupName = ""
                newGroupColor = .blue
            } catch {
                errorMessage = "Не удалось создать группу: \(error.localizedDescription)"
            }
        }
    }

    private func deleteGroup(_ group: Group) {
        Task {
            do {
                try await APIService.shared.deleteGroup(id: group.id)
                groups.removeAll { $0.id == group.id }
                if selectedGroup?.id == group.id {
                    selectedGroup = nil
                }
            } catch {
                errorMessage = "Не удалось удалить группу: \(error.localizedDescription)"
            }
        }
    }

    private func createGroupType(name: String, groupId: Int) {
        Task {
            do {
                let newType = try await APIService.shared.createGroupType(name: name, groupId: groupId)
                groupTypes.append(newType)
            } catch {
                errorMessage = "Не удалось создать тип: \(error.localizedDescription)"
            }
        }
    }

    private func deleteGroupType(_ type: GroupType) {
        Task {
            do {
                try await APIService.shared.deleteGroupType(id: type.id)
                groupTypes.removeAll { $0.id == type.id }
            } catch {
                errorMessage = "Не удалось удалить тип: \(error.localizedDescription)"
            }
        }
    }
}

// MARK: - Group Row

struct GroupRow: View {
    let group: Group

    var body: some View {
        HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 4)
                .fill(group.colorValue)
                .frame(width: 24, height: 24)

            Text(group.name)
                .font(.body)
        }
    }
}

// MARK: - Create Group Sheet

struct CreateGroupSheet: View {
    @Binding var name: String
    @Binding var color: Color
    let onSave: () -> Void
    let onCancel: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("Новая группа")
                .font(.title2)
                .fontWeight(.semibold)

            VStack(alignment: .leading, spacing: 8) {
                Text("Название")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                TextField("Название группы", text: $name)
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

// MARK: - Group Detail View

struct GroupDetailView: View {
    let group: Group
    let types: [GroupType]
    let onCreateType: (String) -> Void
    let onDeleteType: (GroupType) -> Void

    @State private var showingCreateType = false
    @State private var newTypeName = ""

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            HStack(spacing: 12) {
                RoundedRectangle(cornerRadius: 6)
                    .fill(group.colorValue)
                    .frame(width: 32, height: 32)

                Text(group.name)
                    .font(.title2)
                    .fontWeight(.semibold)
            }
            .padding()

            Divider()

            // Types list
            List {
                Section {
                    ForEach(types) { type in
                        HStack {
                            Text(type.name)
                            Spacer()
                            Button {
                                onDeleteType(type)
                            } label: {
                                Image(systemName: "trash")
                                    .foregroundStyle(.red)
                            }
                            .buttonStyle(.plain)
                        }
                    }

                    if types.isEmpty {
                        EmptyStateView(
                            "Нет типов",
                            systemImage: "tray",
                            description: "Добавьте типы для этой группы"
                        )
                    }
                } header: {
                    HStack {
                        Text("Типы группы")
                        Spacer()
                        Button {
                            showingCreateType = true
                        } label: {
                            Image(systemName: "plus.circle.fill")
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
        .sheet(isPresented: $showingCreateType) {
            VStack(alignment: .leading, spacing: 20) {
                Text("Новый тип")
                    .font(.title2)
                    .fontWeight(.semibold)

                VStack(alignment: .leading, spacing: 8) {
                    Text("Название")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)

                    TextField("Название типа", text: $newTypeName)
                        .textFieldStyle(.roundedBorder)
                }

                HStack {
                    Button("Отмена") {
                        showingCreateType = false
                        newTypeName = ""
                    }
                    .keyboardShortcut(.cancelAction)

                    Spacer()

                    Button("Создать") {
                        onCreateType(newTypeName)
                        showingCreateType = false
                        newTypeName = ""
                    }
                    .buttonStyle(.borderedProminent)
                    .keyboardShortcut(.defaultAction)
                    .disabled(newTypeName.isEmpty)
                }
            }
            .padding(24)
            .frame(width: 400)
        }
    }
}

#Preview {
    GroupsView()
        .environmentObject(AppState())
        .frame(width: 1000, height: 600)
}
