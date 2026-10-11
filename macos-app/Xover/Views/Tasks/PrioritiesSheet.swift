//
//  PrioritiesSheet.swift
//  Xover
//
//  Управление приоритетами
//

import SwiftUI

struct PrioritiesSheet: View {
    @EnvironmentObject var appState: AppState
    @Binding var isPresented: Bool
    @State private var newPriorityName = ""
    @State private var newPriorityColor: Color = .blue
    @State private var isCreating = false

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text("Priorities")
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

            // Create new priority
            HStack {
                ColorPicker("", selection: $newPriorityColor)
                    .labelsHidden()

                TextField("New priority name", text: $newPriorityName)
                    .textFieldStyle(.roundedBorder)

                Button("Add") {
                    Task {
                        await createPriority()
                    }
                }
                .buttonStyle(.borderedProminent)
                .disabled(newPriorityName.isEmpty || isCreating)
            }
            .padding()

            Divider()

            // Priorities list
            List {
                ForEach(appState.priorities) { priority in
                    HStack {
                        Circle()
                            .fill(priority.color)
                            .frame(width: 12, height: 12)

                        Text(priority.name)

                        Spacer()

                        Button(action: {
                            Task {
                                await deletePriority(priority)
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
            await appState.loadPriorities()
        }
    }

    private func createPriority() async {
        isCreating = true

        do {
            try await appState.createPriority(name: newPriorityName, color: newPriorityColor)
            newPriorityName = ""
            newPriorityColor = .blue
        } catch {
            print("Failed to create priority: \(error)")
        }

        isCreating = false
    }

    private func deletePriority(_ priority: Priority) async {
        do {
            try await appState.deletePriority(id: priority.id)
        } catch {
            print("Failed to delete priority: \(error)")
        }
    }
}

#Preview {
    PrioritiesSheet(isPresented: .constant(true))
        .environmentObject(AppState())
}
