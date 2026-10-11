//
//  CalendarView.swift
//  Xover
//
//  Календарь задач
//

import SwiftUI

struct CalendarView: View {
    @EnvironmentObject var appState: AppState
    @State private var selectedDate = Date()
    @State private var viewMode: CalendarViewMode = .month

    var body: some View {
        VStack(spacing: 0) {
            // Toolbar
            HStack {
                Text("Календарь")
                    .font(.largeTitle.bold())

                Spacer()

                // View Mode Picker
                Picker("Вид", selection: $viewMode) {
                    ForEach(CalendarViewMode.allCases, id: \.self) { mode in
                        Text(mode.displayName).tag(mode)
                    }
                }
                .pickerStyle(.segmented)
                .frame(width: 300)
            }
            .padding()

            Divider()

            // Calendar Content
            switch viewMode {
            case .day:
                DayView(date: selectedDate)
            case .week:
                WeekView(date: selectedDate)
            case .month:
                MonthView(date: selectedDate)
            case .year:
                YearView(date: selectedDate)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(NSColor.windowBackgroundColor))
    }
}

// MARK: - View Modes

enum CalendarViewMode: String, CaseIterable {
    case day = "Day"
    case week = "Week"
    case month = "Month"
    case year = "Year"

    var displayName: String {
        switch self {
        case .day: return "День"
        case .week: return "Неделя"
        case .month: return "Месяц"
        case .year: return "Год"
        }
    }
}

// MARK: - Placeholder Views

struct DayView: View {
    let date: Date

    var body: some View {
        EmptyStateView(
            "Day View",
            systemImage: "calendar.day.timeline.left",
            description: "Coming soon"
        )
    }
}

struct WeekView: View {
    let date: Date

    var body: some View {
        EmptyStateView(
            "Week View",
            systemImage: "calendar",
            description: "Coming soon"
        )
    }
}

struct YearView: View {
    let date: Date

    var body: some View {
        EmptyStateView(
            "Year View",
            systemImage: "calendar",
            description: "Coming soon"
        )
    }
}

#Preview {
    CalendarView()
        .environmentObject(AppState())
        .frame(width: 1200, height: 800)
}
