//
//  SidebarView.swift
//  Xover
//
//  Боковая панель навигации с поддержкой свёрнутого режима
//

import SwiftUI

struct SidebarView: View {
    @Binding var selectedSection: SidebarSection?
    @EnvironmentObject var appState: AppState
    @State private var isCollapsed = false

    var body: some View {
        VStack(spacing: 0) {
            // Список навигации
            List(selection: $selectedSection) {
                ForEach(SidebarSection.allCases, id: \.self) { section in
                    NavigationLink(value: section) {
                        HStack(spacing: 12) {
                            Image(systemName: section.icon)
                                .frame(width: 20)
                                .foregroundColor(selectedSection == section ? .accentColor : .primary)

                            if !isCollapsed {
                                Text(section.displayName)
                                    .font(.body)
                            }
                        }
                    }
                    .help(section.displayName) // Tooltip при наведении
                }
            }
            .listStyle(.sidebar)

            Divider()

            // Нижняя панель с кнопкой сворачивания и профилем
            HStack(spacing: 12) {
                // Кнопка сворачивания
                Button(action: { isCollapsed.toggle() }) {
                    Image(systemName: isCollapsed ? "sidebar.right" : "sidebar.left")
                        .frame(width: 20)
                }
                .buttonStyle(.plain)
                .help(isCollapsed ? "Развернуть" : "Свернуть")

                if !isCollapsed {
                    Spacer()

                    // Меню профиля
                    Menu {
                        Text(appState.currentUser?.displayName ?? "Пользователь")
                            .font(.headline)

                        Divider()

                        Button("Выход") {
                            appState.logout()
                        }
                    } label: {
                        HStack(spacing: 8) {
                            Image(systemName: "person.circle.fill")
                            Text(appState.currentUser?.displayName ?? "Пользователь")
                                .lineLimit(1)
                        }
                        .font(.subheadline)
                    }
                    .buttonStyle(.plain)
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
            .padding(12)
        }
        .navigationTitle(isCollapsed ? "" : "Xover")
        .frame(minWidth: isCollapsed ? 60 : 200, idealWidth: isCollapsed ? 60 : 220)
    }
}

#Preview {
    NavigationSplitView {
        SidebarView(selectedSection: .constant(.dashboard))
            .environmentObject(AppState())
    } detail: {
        Text("Детали")
    }
    .frame(width: 800, height: 600)
}
