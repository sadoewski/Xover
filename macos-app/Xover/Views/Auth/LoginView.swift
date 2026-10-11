//
//  LoginView.swift
//  Xover
//
//  Экран входа для нативного интерфейса
//

import SwiftUI

struct LoginView: View {
    @EnvironmentObject var appState: AppState
    @State private var username = ""
    @State private var password = ""
    @State private var showPassword = false
    @State private var isLoading = false
    @State private var errorMessage: String?

    var body: some View {
        VStack(spacing: 0) {
            Spacer()

            // Logo и заголовок
            VStack(spacing: 16) {
                Image(systemName: "terminal.fill")
                    .font(.system(size: 64))
                    .foregroundColor(.accentColor)

                Text("Xover")
                    .font(.system(size: 32, weight: .bold))

                Text("Task Management System")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            .padding(.bottom, 48)

            // Форма входа
            VStack(spacing: 20) {
                TextField("Username", text: $username)
                    .textFieldStyle(.roundedBorder)
                    .frame(width: 300)
                    .onSubmit { loginTapped() }

                HStack {
                    if showPassword {
                        TextField("Password", text: $password)
                            .textFieldStyle(.roundedBorder)
                            .onSubmit { loginTapped() }
                    } else {
                        SecureField("Password", text: $password)
                            .textFieldStyle(.roundedBorder)
                            .onSubmit { loginTapped() }
                    }

                    Button(action: { showPassword.toggle() }) {
                        Image(systemName: showPassword ? "eye.slash" : "eye")
                            .foregroundColor(.secondary)
                    }
                    .buttonStyle(.plain)
                }
                .frame(width: 300)

                Button(action: loginTapped) {
                    if isLoading {
                        ProgressView()
                            .controlSize(.small)
                            .frame(width: 280)
                    } else {
                        Text("Sign In")
                            .frame(width: 280)
                    }
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
                .disabled(username.isEmpty || password.isEmpty || isLoading)
                .keyboardShortcut(.return, modifiers: [])

                if let error = errorMessage {
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.red)
                        .frame(width: 300)
                }
            }

            Spacer()
            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(NSColor.windowBackgroundColor))
    }

    private func loginTapped() {
        guard !username.isEmpty && !password.isEmpty else { return }

        Task<Void, Never> {
            await login()
        }
    }

    private func login() async {
        isLoading = true
        errorMessage = nil

        do {
            try await appState.login(username: username, password: password)
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }
}

#Preview {
    LoginView()
        .environmentObject(AppState())
        .frame(width: 800, height: 600)
}
