//
//  FeatureFlags.swift
//  Xover
//
//  Управление feature flags для постепенной миграции на нативный интерфейс
//

import Foundation
import SwiftUI

struct FeatureFlags {
    /// Главный feature flag - использовать ли нативный SwiftUI интерфейс
    /// По умолчанию false - используется старый WebView
    @AppStorage("useNativeInterface") static var useNativeInterface: Bool = false

    /// Debug mode - показывать дополнительную информацию
    @AppStorage("debugMode") static var debugMode: Bool = false

    /// Enable real-time WebSocket sync
    @AppStorage("enableWebSocket") static var enableWebSocket: Bool = true

    /// Enable offline mode with local cache
    @AppStorage("enableOfflineMode") static var enableOfflineMode: Bool = true
}

// MARK: - Helper для доступа к флагам

extension View {
    /// Показывает view только если нативный интерфейс включен
    func ifNativeInterface() -> some View {
        self.opacity(FeatureFlags.useNativeInterface ? 1 : 0)
    }
}
