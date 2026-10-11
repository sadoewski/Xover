# Примеры кода для нативного macOS приложения

## 1. MainWindowView.swift - Главное окно

```swift
import SwiftUI

struct MainWindowView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var navigationVM = NavigationViewModel()
    @State private var columnVisibility: NavigationSplitViewVisibility = .all
    @State private var selectedView: SidebarItem? = .dashboard
    
    var body: some View {
        NavigationSplitView(columnVisibility: $columnVisibility) {
            // Sidebar (200-320pt)
            SidebarView(selection: $selectedView)
                .navigationSplitViewColumnWidth(min: 200, ideal: 240, max: 320)
        } content: {
            // Main Content
            contentView
                .navigationSplitViewColumnWidth(min: 600, ideal: 800)
        } detail: {
            // Inspector (optional)
            if navigationVM.showInspector {
                InspectorView()
                    .navigationSplitViewColumnWidth(min: 260, ideal: 280, max: 360)
            }
        }
        .toolbar {
            ToolbarItemGroup(placement: .navigation) {
                Button(action: { navigationVM.goBack() }) {
                    Image(systemName: "chevron.left")
                }
                .disabled(!navigationVM.canGoBack)
                
                Button(action: { navigationVM.goForward() }) {
                    Image(systemName: "chevron.right")
                }
                .disabled(!navigationVM.canGoForward)
            }
            
            ToolbarItem(placement: .primaryAction) {
                Button(action: { navigationVM.toggleInspector() }) {
                    Image(systemName: "sidebar.right")
                }
                .keyboardShortcut("i", modifiers: [.command, .option])
            }
        }
    }
    
    @ViewBuilder
    private var contentView: some View {
        switch selectedView {
        case .dashboard:
            DashboardView()
        case .calendar:
            CalendarView()
        case .tasks:
            TasksView()
        case .dataTasks:
            DataTasksView()
        case .rwPrint:
            RWPrintView()
        case .terminal:
            TerminalView()
        case .settings:
            SettingsView()
        case .none:
            EmptyStateView(
                icon: "square.stack.3d.up",
                title: "Select a View",
                description: "Choose an item from the sidebar"
            )
        }
    }
}

enum SidebarItem: String, Identifiable, CaseIterable {
    case dashboard = "Dashboard"
    case calendar = "Calendar"
    case tasks = "Tasks"
    case dataTasks = "Data Tasks"
    case rwPrint = "RW Print"
    case terminal = "Terminal"
    case settings = "Settings"
    
    var id: String { rawValue }
    
    var icon: String {
        switch self {
        case .dashboard: return "chart.bar.fill"
        case .calendar: return "calendar"
        case .tasks: return "checkmark.circle"
        case .dataTasks: return "arrow.triangle.2.circlepath"
        case .rwPrint: return "doc.text"
        case .terminal: return "terminal"
        case .settings: return "gear"
        }
    }
    
    var shortcut: KeyEquivalent? {
        switch self {
        case .dashboard: return "1"
        case .calendar: return "2"
        case .tasks: return "3"
        case .dataTasks: return "4"
        case .rwPrint: return "5"
        case .terminal: return "6"
        default: return nil
        }
    }
}
```

## 2. APIClient.swift - Networking layer

```swift
import Foundation

class APIClient: ObservableObject {
    static let shared = APIClient()
    
    @Published var isAuthenticated = false
    private var baseURL: URL
    private var authToken: String?
    
    init(baseURL: String = "http://localhost:5001") {
        self.baseURL = URL(string: baseURL)!
        loadToken()
    }
    
    // MARK: - Authentication
    
    func login(username: String, password: String) async throws -> User {
        let endpoint = APIEndpoint.login(username: username, password: password)
        let response: LoginResponse = try await request(endpoint)
        
        // Save token to Keychain
        try KeychainHelper.save(token: response.token)
        self.authToken = response.token
        self.isAuthenticated = true
        
        return response.user
    }
    
    func logout() {
        KeychainHelper.deleteToken()
        authToken = nil
        isAuthenticated = false
    }
    
    // MARK: - Tasks
    
    func fetchTasks() async throws -> [Task] {
        let endpoint = APIEndpoint.tasks
        return try await request(endpoint)
    }
    
    func createTask(_ task: Task) async throws -> Task {
        let endpoint = APIEndpoint.createTask(task)
        return try await request(endpoint)
    }
    
    func updateTask(_ task: Task) async throws -> Task {
        let endpoint = APIEndpoint.updateTask(task)
        return try await request(endpoint)
    }
    
    func deleteTask(id: Int) async throws {
        let endpoint = APIEndpoint.deleteTask(id: id)
        try await request(endpoint)
    }
    
    // MARK: - Generic Request
    
    private func request<T: Decodable>(_ endpoint: APIEndpoint) async throws -> T {
        var request = URLRequest(url: baseURL.appendingPathComponent(endpoint.path))
        request.httpMethod = endpoint.method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add auth token if available
        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        // Add body if needed
        if let body = endpoint.body {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        switch httpResponse.statusCode {
        case 200...299:
            return try JSONDecoder().decode(T.self, from: data)
        case 401:
            throw APIError.unauthorized
        case 404:
            throw APIError.notFound
        default:
            throw APIError.serverError(httpResponse.statusCode)
        }
    }
    
    private func loadToken() {
        if let token = KeychainHelper.loadToken() {
            self.authToken = token
            self.isAuthenticated = true
        }
    }
}

// MARK: - API Endpoint

enum APIEndpoint {
    case login(username: String, password: String)
    case tasks
    case createTask(Task)
    case updateTask(Task)
    case deleteTask(id: Int)
    
    var path: String {
        switch self {
        case .login:
            return "/api/auth/login"
        case .tasks, .createTask:
            return "/api/tasks"
        case .updateTask(let task), .deleteTask(let id):
            return "/api/tasks/\(task.id ?? id)"
        }
    }
    
    var method: HTTPMethod {
        switch self {
        case .login, .createTask:
            return .post
        case .tasks:
            return .get
        case .updateTask:
            return .put
        case .deleteTask:
            return .delete
        }
    }
    
    var body: [String: Any]? {
        switch self {
        case .login(let username, let password):
            return ["username": username, "password": password]
        case .createTask(let task), .updateTask(let task):
            return task.asDictionary()
        default:
            return nil
        }
    }
}

enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case delete = "DELETE"
}

// MARK: - API Error

enum APIError: LocalizedError {
    case invalidResponse
    case unauthorized
    case notFound
    case serverError(Int)
    case decodingError
    
    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "Invalid server response"
        case .unauthorized:
            return "Unauthorized - please login again"
        case .notFound:
            return "Resource not found"
        case .serverError(let code):
            return "Server error: \(code)"
        case .decodingError:
            return "Failed to decode response"
        }
    }
}
```

## 3. TasksView.swift - Master-Detail for Tasks

```swift
import SwiftUI

struct TasksView: View {
    @StateObject private var viewModel = TasksViewModel()
    @State private var selectedTask: Task?
    @State private var showCreateSheet = false
    @State private var searchText = ""
    
    var body: some View {
        HSplitView {
            // Master: Task List
            taskListView
                .frame(minWidth: 280, idealWidth: 320, maxWidth: 400)
            
            // Detail: Task Detail
            if let task = selectedTask {
                TaskDetailView(task: task)
                    .frame(minWidth: 400)
            } else {
                EmptyStateView(
                    icon: "checkmark.circle",
                    title: "No Task Selected",
                    description: "Select a task from the list"
                )
            }
        }
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button(action: { showCreateSheet = true }) {
                    Label("New Task", systemImage: "plus")
                }
                .keyboardShortcut("n", modifiers: .command)
            }
        }
        .sheet(isPresented: $showCreateSheet) {
            CreateTaskSheet()
        }
        .searchable(text: $searchText)
        .task {
            await viewModel.loadTasks()
        }
    }
    
    private var taskListView: some View {
        List(selection: $selectedTask) {
            ForEach(viewModel.filteredTasks(searchText: searchText)) { task in
                TaskRowView(task: task)
                    .tag(task)
            }
        }
        .listStyle(.sidebar)
    }
}

struct TaskRowView: View {
    let task: Task
    
    var body: some View {
        HStack(spacing: 12) {
            StatusIconView(status: task.status)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(task.title)
                    .font(.body)
                    .lineLimit(1)
                
                if let dueDate = task.dueDate {
                    Text(dueDate, style: .date)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
            
            if let priority = task.priority {
                PriorityBadge(priority: priority)
            }
        }
        .padding(.vertical, 4)
    }
}
```

## 4. CalendarView.swift - Native Calendar

```swift
import SwiftUI

struct CalendarView: View {
    @StateObject private var viewModel = CalendarViewModel()
    @State private var selectedViewMode: CalendarViewMode = .month
    @State private var currentDate = Date()
    
    enum CalendarViewMode: String, CaseIterable {
        case day = "Day"
        case week = "Week"
        case month = "Month"
        case year = "Year"
        
        var icon: String {
            switch self {
            case .day: return "calendar.day.timeline.left"
            case .week: return "calendar"
            case .month: return "calendar.badge.clock"
            case .year: return "calendar.circle"
            }
        }
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Toolbar
            calendarToolbar
                .padding()
                .background(Color(NSColor.controlBackgroundColor))
            
            Divider()
            
            // Calendar Content
            calendarContent
        }
        .task {
            await viewModel.loadTasks(for: currentDate)
        }
    }
    
    private var calendarToolbar: some View {
        HStack {
            // View Mode Picker
            Picker("View", selection: $selectedViewMode) {
                ForEach(CalendarViewMode.allCases, id: \.self) { mode in
                    Label(mode.rawValue, systemImage: mode.icon)
                        .tag(mode)
                }
            }
            .pickerStyle(.segmented)
            .frame(maxWidth: 300)
            
            Spacer()
            
            // Date Navigation
            Button(action: { currentDate = Date() }) {
                Text("Today")
            }
            .keyboardShortcut("t", modifiers: .command)
            
            Button(action: { previousPeriod() }) {
                Image(systemName: "chevron.left")
            }
            
            Text(formattedCurrentPeriod)
                .font(.headline)
                .frame(minWidth: 150)
            
            Button(action: { nextPeriod() }) {
                Image(systemName: "chevron.right")
            }
        }
    }
    
    @ViewBuilder
    private var calendarContent: some View {
        switch selectedViewMode {
        case .day:
            DayView(date: currentDate, tasks: viewModel.tasks)
        case .week:
            WeekView(date: currentDate, tasks: viewModel.tasks)
        case .month:
            MonthView(date: currentDate, tasks: viewModel.tasks)
        case .year:
            YearView(date: currentDate, tasks: viewModel.tasks)
        }
    }
    
    private var formattedCurrentPeriod: String {
        let formatter = DateFormatter()
        switch selectedViewMode {
        case .day:
            formatter.dateStyle = .long
        case .week:
            formatter.dateFormat = "MMM d - d, yyyy"
        case .month:
            formatter.dateFormat = "MMMM yyyy"
        case .year:
            formatter.dateFormat = "yyyy"
        }
        return formatter.string(from: currentDate)
    }
    
    private func previousPeriod() {
        currentDate = Calendar.current.date(
            byAdding: selectedViewMode.calendarComponent,
            value: -1,
            to: currentDate
        ) ?? currentDate
    }
    
    private func nextPeriod() {
        currentDate = Calendar.current.date(
            byAdding: selectedViewMode.calendarComponent,
            value: 1,
            to: currentDate
        ) ?? currentDate
    }
}

extension CalendarView.CalendarViewMode {
    var calendarComponent: Calendar.Component {
        switch self {
        case .day: return .day
        case .week: return .weekOfYear
        case .month: return .month
        case .year: return .year
        }
    }
}
```

## 5. MonthView.swift - Calendar Grid

```swift
import SwiftUI

struct MonthView: View {
    let date: Date
    let tasks: [Task]
    
    private let columns = Array(repeating: GridItem(.flexible(), spacing: 1), count: 7)
    private let calendar = Calendar.current
    
    var body: some View {
        ScrollView {
            LazyVGrid(columns: columns, spacing: 1) {
                // Weekday headers
                ForEach(weekdaySymbols, id: \.self) { weekday in
                    Text(weekday)
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(.secondary)
                        .frame(height: 30)
                }
                
                // Calendar days
                ForEach(daysInMonth, id: \.self) { day in
                    CalendarDayCell(
                        day: day,
                        tasks: tasksForDay(day),
                        isToday: calendar.isDateInToday(day),
                        isCurrentMonth: calendar.isDate(day, equalTo: date, toGranularity: .month)
                    )
                }
            }
            .padding()
        }
        .background(Color(NSColor.controlBackgroundColor))
    }
    
    private var weekdaySymbols: [String] {
        calendar.shortWeekdaySymbols
    }
    
    private var daysInMonth: [Date] {
        guard let monthInterval = calendar.dateInterval(of: .month, for: date),
              let monthFirstWeek = calendar.dateInterval(of: .weekOfMonth, for: monthInterval.start)
        else { return [] }
        
        var days: [Date] = []
        var currentDate = monthFirstWeek.start
        
        while days.count < 42 { // 6 weeks × 7 days
            days.append(currentDate)
            currentDate = calendar.date(byAdding: .day, value: 1, to: currentDate)!
        }
        
        return days
    }
    
    private func tasksForDay(_ day: Date) -> [Task] {
        tasks.filter { task in
            guard let dueDate = task.dueDate else { return false }
            return calendar.isDate(dueDate, inSameDayAs: day)
        }
    }
}

struct CalendarDayCell: View {
    let day: Date
    let tasks: [Task]
    let isToday: Bool
    let isCurrentMonth: Bool
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("\(Calendar.current.component(.day, from: day))")
                .font(.caption)
                .fontWeight(isToday ? .bold : .regular)
                .foregroundColor(isToday ? .white : (isCurrentMonth ? .primary : .secondary))
                .padding(4)
                .background(isToday ? Color.accentColor : Color.clear)
                .clipShape(Circle())
            
            ForEach(tasks.prefix(3)) { task in
                MiniTaskBadge(task: task)
            }
            
            if tasks.count > 3 {
                Text("+\(tasks.count - 3) more")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
        }
        .frame(height: 100)
        .frame(maxWidth: .infinity)
        .padding(4)
        .background(Color(NSColor.controlBackgroundColor))
        .opacity(isCurrentMonth ? 1.0 : 0.5)
    }
}

struct MiniTaskBadge: View {
    let task: Task
    
    var body: some View {
        HStack(spacing: 2) {
            Circle()
                .fill(task.priority?.color ?? Color.gray)
                .frame(width: 4, height: 4)
            
            Text(task.title)
                .font(.caption2)
                .lineLimit(1)
        }
        .padding(.horizontal, 4)
        .padding(.vertical, 2)
        .background(Color(NSColor.controlColor).opacity(0.5))
        .cornerRadius(4)
    }
}
```

## 6. Feature Flag в XoverApp.swift

```swift
import SwiftUI

@main
struct XoverApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @StateObject private var appState = AppState()
    @AppStorage("useNativeInterface") private var useNative = false
    
    var body: some Scene {
        WindowGroup {
            Group {
                if useNative {
                    // НОВЫЙ: Native SwiftUI Interface
                    nativeInterface
                } else {
                    // LEGACY: WebView-based Interface
                    legacyInterface
                }
            }
            .environmentObject(appState)
            .frame(minWidth: 1024, minHeight: 768)
        }
        .commands {
            MenuCommands(useNative: $useNative)
        }
        .defaultSize(width: 1280, height: 900)
        
        Settings {
            SettingsView(useNative: $useNative)
                .environmentObject(appState)
        }
    }
    
    @ViewBuilder
    private var nativeInterface: some View {
        if appState.isAuthenticated {
            MainWindowView()
        } else {
            LoginView()
        }
    }
    
    @ViewBuilder
    private var legacyInterface: some View {
        ContentView()
            .task {
                appDelegate.startBackendIfNeeded()
            }
    }
}
```

---

Эти примеры показывают основную структуру нативного SwiftUI приложения для macOS.
