//
//  EventsView.swift
//  Xover
//
//  Управление событиями
//

import SwiftUI

struct EventsView: View {
    @State private var events: [Event] = []
    @State private var selectedEvent: Event?
    @State private var isLoading = false
    @State private var showingCreateEvent = false
    @State private var errorMessage: String?

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text("События")
                    .font(.title)
                    .fontWeight(.bold)

                Spacer()

                Button {
                    showingCreateEvent = true
                } label: {
                    Label("Добавить событие", systemImage: "plus")
                }
                .buttonStyle(.borderedProminent)
            }
            .padding()

            Divider()

            // List
            if events.isEmpty {
                ContentUnavailableView(
                    "Нет событий",
                    systemImage: "flag",
                    description: Text("Создайте события для отслеживания важных дат")
                )
            } else {
                List(selection: $selectedEvent) {
                    ForEach(groupedEvents.keys.sorted(by: >), id: \.self) { year in
                        Section(String(year)) {
                            ForEach(groupedEvents[year] ?? []) { event in
                                EventRow(event: event)
                                    .tag(event)
                                    .contextMenu {
                                        Button(role: .destructive) {
                                            deleteEvent(event)
                                        } label: {
                                            Label("Удалить", systemImage: "trash")
                                        }
                                    }
                            }
                        }
                    }
                }
            }
        }
        .sheet(isPresented: $showingCreateEvent) {
            CreateEventSheet(
                onSave: createEvent,
                onCancel: {
                    showingCreateEvent = false
                }
            )
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

    private var groupedEvents: [Int: [Event]] {
        Dictionary(grouping: events) { event in
            Calendar.current.component(.year, from: event.date)
        }
    }

    // MARK: - Data Loading

    private func loadData() async {
        isLoading = true
        defer { isLoading = false }

        do {
            events = try await APIService.shared.getEvents()
        } catch {
            errorMessage = "Не удалось загрузить события: \(error.localizedDescription)"
        }
    }

    // MARK: - Actions

    private func createEvent(_ event: Event) {
        Task {
            do {
                let newEvent = try await APIService.shared.createEvent(event)
                events.append(newEvent)
                showingCreateEvent = false
            } catch {
                errorMessage = "Не удалось создать событие: \(error.localizedDescription)"
            }
        }
    }

    private func deleteEvent(_ event: Event) {
        Task {
            do {
                try await APIService.shared.deleteEvent(id: event.id)
                events.removeAll { $0.id == event.id }
                if selectedEvent?.id == event.id {
                    selectedEvent = nil
                }
            } catch {
                errorMessage = "Не удалось удалить событие: \(error.localizedDescription)"
            }
        }
    }
}

// MARK: - Event Row

struct EventRow: View {
    let event: Event

    var body: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(event.colorValue)
                .frame(width: 8, height: 8)

            VStack(alignment: .leading, spacing: 4) {
                Text(event.name)
                    .font(.body)

                Text(event.date, style: .date)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Create Event Sheet

struct CreateEventSheet: View {
    @State private var name = ""
    @State private var description = ""
    @State private var date = Date()
    @State private var color = Color.blue

    let onSave: (Event) -> Void
    let onCancel: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("Новое событие")
                .font(.title2)
                .fontWeight(.semibold)

            VStack(alignment: .leading, spacing: 16) {
                // Название
                VStack(alignment: .leading, spacing: 8) {
                    Text("Название")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)

                    TextField("Название события", text: $name)
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

                // Дата
                VStack(alignment: .leading, spacing: 8) {
                    Text("Дата")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)

                    DatePicker("Дата события", selection: $date, displayedComponents: .date)
                        .datePickerStyle(.compact)
                }

                // Цвет
                VStack(alignment: .leading, spacing: 8) {
                    Text("Цвет")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)

                    ColorPicker("Выберите цвет", selection: $color, supportsOpacity: false)
                }
            }

            HStack {
                Button("Отмена", action: onCancel)
                    .keyboardShortcut(.cancelAction)

                Spacer()

                Button("Создать") {
                    let event = Event(
                        id: 0,
                        name: name,
                        description: description.isEmpty ? nil : description,
                        date: date,
                        color: color.toHex()
                    )
                    onSave(event)
                }
                .buttonStyle(.borderedProminent)
                .keyboardShortcut(.defaultAction)
                .disabled(name.isEmpty)
            }
        }
        .padding(24)
        .frame(width: 450)
    }
}

#Preview {
    EventsView()
        .frame(width: 800, height: 600)
}
