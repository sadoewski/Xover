//
//  MonthView.swift
//  Xover
//
//  Календарь в виде месяца
//

import SwiftUI

struct MonthView: View {
    @EnvironmentObject var appState: AppState
    let date: Date

    @State private var currentMonth: Date

    init(date: Date) {
        self.date = date
        self._currentMonth = State(initialValue: date)
    }

    private let calendar = Calendar.current
    private let daysOfWeek = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"]

    var body: some View {
        VStack(spacing: 0) {
            // Month navigation
            HStack {
                Button(action: previousMonth) {
                    Image(systemName: "chevron.left")
                }
                .buttonStyle(.borderless)

                Spacer()

                Text(currentMonth, format: .dateTime.month(.wide).year())
                    .font(.title2.bold())

                Spacer()

                Button(action: nextMonth) {
                    Image(systemName: "chevron.right")
                }
                .buttonStyle(.borderless)

                Button("Сегодня") {
                    currentMonth = Date()
                }
                .buttonStyle(.bordered)
            }
            .padding()

            Divider()

            // Calendar grid
            VStack(spacing: 0) {
                // Days of week header
                HStack(spacing: 0) {
                    ForEach(daysOfWeek, id: \.self) { day in
                        Text(day)
                            .font(.caption.bold())
                            .foregroundColor(.secondary)
                            .frame(maxWidth: .infinity)
                    }
                }
                .padding(.vertical, 8)

                Divider()

                // Days grid
                LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 0), count: 7), spacing: 0) {
                    ForEach(daysInMonth(), id: \.self) { day in
                        DayCell(
                            day: day,
                            isCurrentMonth: calendar.isDate(day, equalTo: currentMonth, toGranularity: .month),
                            isToday: calendar.isDateInToday(day),
                            tasks: tasksForDay(day)
                        )
                    }
                }
            }
            .padding()
        }
    }

    private func daysInMonth() -> [Date] {
        guard let monthInterval = calendar.dateInterval(of: .month, for: currentMonth),
              let monthFirstWeek = calendar.dateInterval(of: .weekOfMonth, for: monthInterval.start) else {
            return []
        }

        var dates: [Date] = []
        var date = monthFirstWeek.start

        // 6 недель для полного отображения
        for _ in 0..<42 {
            dates.append(date)
            date = calendar.date(byAdding: .day, value: 1, to: date)!
        }

        return dates
    }

    private func tasksForDay(_ day: Date) -> [TaskItem] {
        appState.tasks.filter { task in
            guard let dueDate = task.dueDate else { return false }
            return calendar.isDate(dueDate, inSameDayAs: day)
        }
    }

    private func previousMonth() {
        currentMonth = calendar.date(byAdding: .month, value: -1, to: currentMonth) ?? currentMonth
    }

    private func nextMonth() {
        currentMonth = calendar.date(byAdding: .month, value: 1, to: currentMonth) ?? currentMonth
    }
}

// MARK: - Day Cell

struct DayCell: View {
    let day: Date
    let isCurrentMonth: Bool
    let isToday: Bool
    let tasks: [TaskItem]

    private let calendar = Calendar.current

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            // Day number
            Text("\(calendar.component(.day, from: day))")
                .font(.system(size: 14, weight: isToday ? .bold : .regular))
                .foregroundColor(isCurrentMonth ? .primary : .secondary)
                .padding(4)
                .background(
                    Circle()
                        .fill(isToday ? Color.accentColor : Color.clear)
                        .frame(width: 28, height: 28)
                )
                .foregroundColor(isToday ? .white : .primary)

            // TaskItem indicators
            if !tasks.isEmpty {
                ForEach(tasks.prefix(3)) { task in
                    RoundedRectangle(cornerRadius: 2)
                        .fill(colorForStatus(task.status))
                        .frame(height: 4)
                }

                if tasks.count > 3 {
                    Text("+\(tasks.count - 3)")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }

            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .padding(4)
        .background(Color(NSColor.controlBackgroundColor).opacity(isCurrentMonth ? 1 : 0.3))
        .border(Color.gray.opacity(0.2), width: 0.5)
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
    MonthView(date: Date())
        .environmentObject(AppState())
        .frame(width: 1000, height: 800)
}
