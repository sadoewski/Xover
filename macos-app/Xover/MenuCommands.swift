//
//  MenuCommands.swift
//  Xover
//
//  Application menu commands
//

import SwiftUI

struct MenuCommands: Commands {
    @FocusedValue(\.selectedTask) var selectedTask: TaskItem?

    var body: some Commands {
        CommandGroup(replacing: .newItem) {
            Button("New Task") {
                NotificationCenter.default.post(name: .createNewTask, object: nil)
            }
            .keyboardShortcut("n", modifiers: .command)
        }

        CommandGroup(after: .appInfo) {
            Divider()

            Button("Check for Updates...") {
                // TODO: Implement update checking
            }
        }

        CommandMenu("Task") {
            Button("Complete Task") {
                if let task = selectedTask {
                    NotificationCenter.default.post(
                        name: .completeTask,
                        object: nil,
                        userInfo: ["task": task]
                    )
                }
            }
            .keyboardShortcut("d", modifiers: .command)
            .disabled(selectedTask == nil)

            Button("Delete Task") {
                if let task = selectedTask {
                    NotificationCenter.default.post(
                        name: .deleteTask,
                        object: nil,
                        userInfo: ["task": task]
                    )
                }
            }
            .keyboardShortcut(.delete, modifiers: .command)
            .disabled(selectedTask == nil)
        }

        CommandGroup(replacing: .help) {
            Button("Xover Help") {
                NSWorkspace.shared.open(URL(string: "https://github.com/your-repo/xover/wiki")!)
            }

            Divider()

            Button("Report Issue") {
                NSWorkspace.shared.open(URL(string: "https://github.com/your-repo/xover/issues")!)
            }
        }
    }
}

// MARK: - Focused Values

struct SelectedTaskKey: FocusedValueKey {
    typealias Value = TaskItem
}

extension FocusedValues {
    var selectedTask: SelectedTaskKey.Value? {
        get { self[SelectedTaskKey.self] }
        set { self[SelectedTaskKey.self] = newValue }
    }
}
