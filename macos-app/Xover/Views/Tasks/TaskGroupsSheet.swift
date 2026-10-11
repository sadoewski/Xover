//
//  TaskGroupsSheet.swift
//  Xover
//
//  Управление группами задач
//

import SwiftUI

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

#Preview {
    TaskGroupsSheet(isPresented: .constant(true))
        .environmentObject(AppState())
}
