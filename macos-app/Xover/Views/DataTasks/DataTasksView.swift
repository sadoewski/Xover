//
//  DataTasksView.swift
//  Xover
//
//  Представление для DataTasks (фоновые задачи обработки данных)
//

import SwiftUI

struct DataTasksView: View {
    @EnvironmentObject var appState: AppState
    @State private var selectedTask: DataTask?
    @State private var searchText = ""

    var body: some View {
        NavigationSplitView {
            // Task List
            VStack(spacing: 0) {
                // Search
                TextField("Search data tasks...", text: $searchText)
                    .textFieldStyle(.roundedBorder)
                    .padding()

                Divider()

                // List
                List(selection: $selectedTask) {
                    ForEach(mockDataTasks) { task in
                        DataTaskRow(task: task)
                            .tag(task)
                    }
                }
                .listStyle(.sidebar)
            }
            .navigationTitle("Data Tasks")
            .navigationSplitViewColumnWidth(min: 300, ideal: 350, max: 500)
            .toolbar {
                ToolbarItem(placement: .automatic) {
                    Button(action: {}) {
                        Image(systemName: "plus")
                    }
                }
            }
        } detail: {
            if let task = selectedTask {
                DataTaskDetailView(task: task)
            } else {
                EmptyStateView(
                    "Select a Data Task",
                    systemImage: "server.rack",
                    description: "Choose a task from the list to view details"
                )
            }
        }
    }

    private var mockDataTasks: [DataTask] {
        [
            DataTask(
                id: 1,
                name: "Data Import",
                status: "running",
                progress: 0.65,
                createdAt: Date().addingTimeInterval(-3600)
            ),
            DataTask(
                id: 2,
                name: "Report Generation",
                status: "completed",
                progress: 1.0,
                createdAt: Date().addingTimeInterval(-7200)
            ),
            DataTask(
                id: 3,
                name: "Backup Process",
                status: "pending",
                progress: 0.0,
                createdAt: Date()
            )
        ]
    }
}

// MARK: - Data Task Row

struct DataTaskRow: View {
    let task: DataTask

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: statusIcon)
                .foregroundColor(statusColor)
                .frame(width: 20)

            VStack(alignment: .leading, spacing: 4) {
                Text(task.name)
                    .font(.headline)

                HStack {
                    Text(task.status.capitalized)
                        .font(.caption)
                        .foregroundColor(.secondary)

                    if task.progress > 0 && task.progress < 1 {
                        Text("\(Int(task.progress * 100))%")
                            .font(.caption)
                            .foregroundColor(.blue)
                    }
                }
            }

            Spacer()
        }
        .padding(.vertical, 4)
    }

    private var statusIcon: String {
        switch task.status {
        case "running": return "arrow.clockwise"
        case "completed": return "checkmark.circle.fill"
        case "failed": return "xmark.circle.fill"
        default: return "circle"
        }
    }

    private var statusColor: Color {
        switch task.status {
        case "running": return .blue
        case "completed": return .green
        case "failed": return .red
        default: return .gray
        }
    }
}

// MARK: - Data Task Detail View

struct DataTaskDetailView: View {
    let task: DataTask

    var body: some View {
        VStack(spacing: 20) {
            // Header
            VStack(spacing: 8) {
                Image(systemName: "server.rack")
                    .font(.system(size: 48))
                    .foregroundColor(.blue)

                Text(task.name)
                    .font(.title)
                    .fontWeight(.bold)

                Text(task.status.capitalized)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            .padding()

            // Progress
            if task.progress > 0 && task.progress < 1 {
                VStack(spacing: 8) {
                    ProgressView(value: task.progress)
                        .progressViewStyle(.linear)

                    Text("\(Int(task.progress * 100))% Complete")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .padding(.horizontal, 40)
            }

            Divider()
                .padding(.horizontal, 40)

            // Details
            Form {
                LabeledContent("Created") {
                    Text(task.createdAt, style: .relative)
                }

                LabeledContent("Status") {
                    Text(task.status.capitalized)
                }

                if task.progress > 0 {
                    LabeledContent("Progress") {
                        Text("\(Int(task.progress * 100))%")
                    }
                }
            }
            .formStyle(.grouped)
            .frame(maxWidth: 500)

            Spacer()
        }
        .padding()
    }
}

// MARK: - Data Task Model

struct DataTask: Identifiable, Hashable {
    var id: Int
    var name: String
    var status: String
    var progress: Double
    var createdAt: Date
}

#Preview {
    DataTasksView()
        .environmentObject(AppState())
        .frame(width: 1200, height: 800)
}
