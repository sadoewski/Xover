//
//  MainWindowView.swift
//  Xover
//
//  Главное окно с нативным интерфейсом
//

import SwiftUI

struct MainWindowView: View {
    @EnvironmentObject var appState: AppState
    @State private var selectedSection: SidebarSection? = .dashboard
    @State private var columnVisibility: NavigationSplitViewVisibility = .all

    var body: some View {
        NavigationSplitView(columnVisibility: $columnVisibility) {
            // Sidebar
            SidebarView(selectedSection: $selectedSection)
                .navigationSplitViewColumnWidth(min: 200, ideal: 220, max: 300)
        } detail: {
            // Main content
            if let section = selectedSection {
                switch section {
                case .dashboard:
                    DashboardView()
                case .tasks:
                    TasksView()
                case .datatasks:
                    DataTasksView()
                case .calendar:
                    CalendarView()
                case .groups:
                    GroupsView()
                case .priorities:
                    PrioritiesView()
                case .templates:
                    TemplatesView()
                case .events:
                    EventsView()
                case .rwprint:
                    RWPrintView()
                case .terminal:
                    TerminalView()
                case .settings:
                    SettingsView()
                }
            } else {
                EmptyView()
            }
        }
        .task {
            await appState.loadTasks()
        }
    }
}

// MARK: - Sidebar Sections

enum SidebarSection: String, CaseIterable, Hashable {
    case dashboard = "Dashboard"
    case tasks = "Tasks"
    case datatasks = "DataTasks"
    case calendar = "Calendar"
    case groups = "Groups"
    case priorities = "Priorities"
    case templates = "Templates"
    case events = "Events"
    case rwprint = "RW:Print"
    case terminal = "Terminal"
    case settings = "Settings"

    var displayName: String {
        switch self {
        case .dashboard: return "Панель"
        case .tasks: return "Задачи"
        case .datatasks: return "Дата-задачи"
        case .calendar: return "Календарь"
        case .groups: return "Группы"
        case .priorities: return "Приоритеты"
        case .templates: return "Шаблоны"
        case .events: return "События"
        case .rwprint: return "RW:Print"
        case .terminal: return "Терминал"
        case .settings: return "Настройки"
        }
    }

    var icon: String {
        switch self {
        case .dashboard: return "house.fill"
        case .tasks: return "checklist"
        case .datatasks: return "server.rack"
        case .calendar: return "calendar"
        case .groups: return "folder.fill"
        case .priorities: return "star.fill"
        case .templates: return "doc.text.fill"
        case .events: return "flag.fill"
        case .rwprint: return "printer.fill"
        case .terminal: return "terminal.fill"
        case .settings: return "gearshape.fill"
        }
    }
}

#Preview {
    MainWindowView()
        .environmentObject(AppState())
        .frame(width: 1200, height: 800)
}
