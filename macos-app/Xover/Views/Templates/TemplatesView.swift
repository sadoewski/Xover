//
//  TemplatesView.swift
//  Xover
//
//  Управление шаблонами задач
//

import SwiftUI

struct TemplatesView: View {
    @EnvironmentObject var appState: AppState
    @State private var templates: [TaskTemplate] = []
    @State private var selectedTemplate: TaskTemplate?
    @State private var isLoading = false
    @State private var showingCreateTemplate = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationSplitView {
            // Список шаблонов
            List(selection: $selectedTemplate) {
                Section("Шаблоны") {
                    ForEach(templates) { template in
                        TemplateRow(template: template)
                            .tag(template)
                            .contextMenu {
                                Button(role: .destructive) {
                                    deleteTemplate(template)
                                } label: {
                                    Label("Удалить", systemImage: "trash")
                                }
                            }
                    }
                }
            }
            .navigationTitle("Шаблоны")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        showingCreateTemplate = true
                    } label: {
                        Label("Добавить шаблон", systemImage: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingCreateTemplate) {
                CreateTemplateSheet(
                    onSave: { template in
                        createTemplate(template)
                    },
                    onCancel: {
                        showingCreateTemplate = false
                    }
                )
            }
        } detail: {
            // Детали шаблона
            if let template = selectedTemplate {
                TemplateDetailView(template: template)
            } else {
                EmptyStateView(
                    "Выберите шаблон",
                    systemImage: "doc.text",
                    description: "Выберите шаблон из списка, чтобы просмотреть детали"
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
            templates = try await APIService.shared.getTemplates()
        } catch {
            errorMessage = "Не удалось загрузить шаблоны: \(error.localizedDescription)"
        }
    }

    // MARK: - Actions

    private func createTemplate(_ template: TaskTemplate) {
        Task {
            do {
                let newTemplate = try await APIService.shared.createTemplate(template)
                templates.append(newTemplate)
                showingCreateTemplate = false
            } catch {
                errorMessage = "Не удалось создать шаблон: \(error.localizedDescription)"
            }
        }
    }

    private func deleteTemplate(_ template: TaskTemplate) {
        Task {
            do {
                try await APIService.shared.deleteTemplate(id: template.id)
                templates.removeAll { $0.id == template.id }
                if selectedTemplate?.id == template.id {
                    selectedTemplate = nil
                }
            } catch {
                errorMessage = "Не удалось удалить шаблон: \(error.localizedDescription)"
            }
        }
    }
}

// MARK: - Template Row

struct TemplateRow: View {
    let template: TaskTemplate

    var body: some View {
        HStack {
            Image(systemName: "doc.text")
                .foregroundStyle(.blue)

            VStack(alignment: .leading, spacing: 4) {
                Text(template.name)
                    .font(.body)

                if let description = template.description {
                    Text(description)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            }
        }
    }
}

// MARK: - Create Template Sheet

struct CreateTemplateSheet: View {
    @EnvironmentObject var appState: AppState
    @State private var name = ""
    @State private var description = ""
    @State private var selectedGroupId: Int?
    @State private var selectedPriorityId: Int?
    @State private var checklistItems: [String] = []
    @State private var newChecklistItem = ""

    let onSave: (TaskTemplate) -> Void
    let onCancel: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("Новый шаблон")
                .font(.title2)
                .fontWeight(.semibold)

            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    // Название
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Название")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)

                        TextField("Название шаблона", text: $name)
                            .textFieldStyle(.roundedBorder)
                    }

                    // Описание
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Описание")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)

                        TextEditor(text: $description)
                            .frame(height: 80)
                            .overlay(
                                RoundedRectangle(cornerRadius: 4)
                                    .stroke(Color.secondary.opacity(0.2), lineWidth: 1)
                            )
                    }

                    // Приоритет
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Приоритет по умолчанию")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)

                        Picker("Приоритет", selection: $selectedPriorityId) {
                            Text("Не выбран").tag(nil as Int?)
                            ForEach(appState.priorities) { priority in
                                Text(priority.name).tag(priority.id as Int?)
                            }
                        }
                    }

                    // Чек-лист
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Чек-лист")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)

                        ForEach(Array(checklistItems.enumerated()), id: \.offset) { index, item in
                            HStack {
                                Text("• \(item)")
                                Spacer()
                                Button {
                                    checklistItems.remove(at: index)
                                } label: {
                                    Image(systemName: "xmark.circle.fill")
                                        .foregroundStyle(.red)
                                }
                                .buttonStyle(.plain)
                            }
                        }

                        HStack {
                            TextField("Добавить пункт", text: $newChecklistItem)
                                .textFieldStyle(.roundedBorder)

                            Button {
                                if !newChecklistItem.isEmpty {
                                    checklistItems.append(newChecklistItem)
                                    newChecklistItem = ""
                                }
                            } label: {
                                Image(systemName: "plus.circle.fill")
                            }
                        }
                    }
                }
            }

            HStack {
                Button("Отмена", action: onCancel)
                    .keyboardShortcut(.cancelAction)

                Spacer()

                Button("Создать") {
                    let template = TaskTemplate(
                        id: 0,
                        name: name,
                        description: description.isEmpty ? nil : description,
                        defaultPriorityId: selectedPriorityId,
                        defaultGroupId: selectedGroupId,
                        defaultGroupTypeId: nil,
                        checklistItems: checklistItems.isEmpty ? nil : checklistItems
                    )
                    onSave(template)
                }
                .buttonStyle(.borderedProminent)
                .keyboardShortcut(.defaultAction)
                .disabled(name.isEmpty)
            }
        }
        .padding(24)
        .frame(width: 500, height: 600)
        .task {
            await appState.loadPriorities()
        }
    }
}

// MARK: - Template Detail View

struct TemplateDetailView: View {
    let template: TaskTemplate

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text(template.name)
                    .font(.title)
                    .fontWeight(.bold)

                if let description = template.description {
                    Text(description)
                        .font(.body)
                        .foregroundStyle(.secondary)
                }

                if let items = template.checklistItems, !items.isEmpty {
                    Divider()

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Чек-лист")
                            .font(.headline)

                        ForEach(items, id: \.self) { item in
                            HStack {
                                Image(systemName: "circle")
                                    .foregroundStyle(.secondary)
                                Text(item)
                            }
                        }
                    }
                }
            }
            .padding()
        }
    }
}

#Preview {
    TemplatesView()
        .environmentObject(AppState())
        .frame(width: 1000, height: 600)
}
