//
//  KeychainHelper.swift
//  Xover
//
//  Безопасное хранение токена в Keychain
//

import Foundation
import Security

struct KeychainHelper {
    private static let service = "com.hostprint.xover"
    private static let account = "authToken"

    /// Сохранить токен в Keychain
    static func save(token: String) throws {
        let data = token.data(using: .utf8)!

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecValueData as String: data
        ]

        // Удалить старый токен если есть
        SecItemDelete(query as CFDictionary)

        // Добавить новый токен
        let status = SecItemAdd(query as CFDictionary, nil)

        guard status == errSecSuccess else {
            throw KeychainError.unableToSave
        }
    }

    /// Загрузить токен из Keychain
    static func loadToken() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess,
              let data = result as? Data,
              let token = String(data: data, encoding: .utf8) else {
            return nil
        }

        return token
    }

    /// Удалить токен из Keychain
    static func deleteToken() {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]

        SecItemDelete(query as CFDictionary)
    }
}

enum KeychainError: Error {
    case unableToSave
    case unableToLoad
    case unableToDelete
}
