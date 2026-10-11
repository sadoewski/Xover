//
//  TerminalView.swift
//  Xover
//
//  Встроенный терминал для выполнения команд
//

import SwiftUI

struct TerminalView: View {
    @State private var command = ""
    @State private var output: [TerminalLine] = []
    @State private var isExecuting = false
    @State private var commandHistory: [String] = []
    @State private var historyIndex = -1
    @FocusState private var isInputFocused: Bool

    var body: some View {
        VStack(spacing: 0) {
            // Заголовок
            HStack {
                Image(systemName: "terminal.fill")
                Text("Терминал")
                    .font(.headline)

                Spacer()

                Button(action: clearOutput) {
                    Label("Очистить", systemImage: "trash")
                        .labelStyle(.iconOnly)
                }
                .buttonStyle(.plain)
                .help("Очистить историю команд")
            }
            .padding()
            .background(Color(nsColor: .controlBackgroundColor))

            Divider()

            // Вывод терминала
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 4) {
                        ForEach(output) { line in
                            TerminalLineView(line: line)
                                .id(line.id)
                        }
                    }
                    .padding()
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color(nsColor: .textBackgroundColor))
                .onChange(of: output.count) { _ in
                    if let lastLine = output.last {
                        withAnimation {
                            proxy.scrollTo(lastLine.id, anchor: .bottom)
                        }
                    }
                }
            }

            Divider()

            // Поле ввода команды
            HStack(spacing: 12) {
                Text("$")
                    .foregroundColor(.secondary)
                    .fontDesign(.monospaced)

                TextField("Введите команду...", text: $command)
                    .textFieldStyle(.plain)
                    .font(.system(.body, design: .monospaced))
                    .focused($isInputFocused)
                    .onSubmit {
                        executeCommand()
                    }
                    .disabled(isExecuting)

                if isExecuting {
                    ProgressView()
                        .controlSize(.small)
                }
            }
            .padding()
            .background(Color(nsColor: .controlBackgroundColor))
        }
        .onAppear {
            isInputFocused = true
            addWelcomeMessage()
        }
    }

    // MARK: - Actions

    private func addWelcomeMessage() {
        output.append(TerminalLine(
            text: "Добро пожаловать в встроенный терминал Xover",
            type: .info
        ))
        output.append(TerminalLine(
            text: "Введите команду и нажмите Enter для выполнения",
            type: .info
        ))
        output.append(TerminalLine(text: "", type: .output))
    }

    private func executeCommand() {
        guard !command.isEmpty else { return }

        // Добавляем команду в историю
        commandHistory.append(command)
        historyIndex = commandHistory.count

        // Показываем команду в выводе
        output.append(TerminalLine(text: "$ \(command)", type: .command))

        let currentCommand = command
        command = ""
        isExecuting = true

        Task {
            do {
                let result = try await APIService.shared.executeCommand(currentCommand)

                await MainActor.run {
                    if !result.output.isEmpty {
                        output.append(TerminalLine(text: result.output, type: .output))
                    }

                    if let error = result.error, !error.isEmpty {
                        output.append(TerminalLine(text: error, type: .error))
                    }

                    output.append(TerminalLine(text: "", type: .output))
                    isExecuting = false
                    isInputFocused = true
                }
            } catch {
                await MainActor.run {
                    output.append(TerminalLine(
                        text: "Ошибка выполнения: \(error.localizedDescription)",
                        type: .error
                    ))
                    output.append(TerminalLine(text: "", type: .output))
                    isExecuting = false
                    isInputFocused = true
                }
            }
        }
    }

    private func clearOutput() {
        output.removeAll()
        addWelcomeMessage()
    }
}

// MARK: - Terminal Line Model

struct TerminalLine: Identifiable {
    let id = UUID()
    let text: String
    let type: LineType
    let timestamp = Date()

    enum LineType {
        case command
        case output
        case error
        case info
    }
}

// MARK: - Terminal Line View

struct TerminalLineView: View {
    let line: TerminalLine

    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            Text(line.text)
                .font(.system(.body, design: .monospaced))
                .foregroundColor(color)
                .textSelection(.enabled)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var color: Color {
        switch line.type {
        case .command:
            return .primary
        case .output:
            return .secondary
        case .error:
            return .red
        case .info:
            return .blue
        }
    }
}

#Preview {
    TerminalView()
        .frame(width: 800, height: 600)
}
