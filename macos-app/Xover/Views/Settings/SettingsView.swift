//
//  SettingsView.swift
//  Xover
//
//  Настройки приложения
//

import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var appState: AppState
    @AppStorage("apiBaseURL") private var apiBaseURL = "http://localhost:5001"
    @AppStorage("darkModeEnabled") private var darkModeEnabled = false
    @AppStorage("notificationsEnabled") private var notificationsEnabled = true

    var body: some View {
        Form {
            Section("Аккаунт") {
                if let user = appState.currentUser {
                    LabeledContent("Имя пользователя", value: user.username)
                    LabeledContent("Email", value: user.email ?? "Не указан")
                    LabeledContent("Отображаемое имя", value: user.displayName)
                }

                Button("Выйти", role: .destructive) {
                    appState.logout()
                }
            }

            Section("Настройки API") {
                TextField("Базовый URL", text: $apiBaseURL)
                    .textFieldStyle(.roundedBorder)

                Text("Перезапустите приложение для применения изменений")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Section("Внешний вид") {
                Toggle("Тёмная тема", isOn: $darkModeEnabled)
            }

            Section("Уведомления") {
                Toggle("Включить уведомления", isOn: $notificationsEnabled)
            }

            Section("О приложении") {
                LabeledContent("Версия", value: "1.0.0")
                LabeledContent("Сборка", value: "1")
            }
        }
        .formStyle(.grouped)
        .navigationTitle("Настройки")
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(NSColor.windowBackgroundColor))
    }
}

#Preview {
    SettingsView()
        .environmentObject(AppState())
        .frame(width: 800, height: 600)
}
