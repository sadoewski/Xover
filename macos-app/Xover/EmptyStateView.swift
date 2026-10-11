//
//  EmptyStateView.swift
//  Xover
//
//  macOS 13+ compatible empty state view
//

import SwiftUI

struct EmptyStateView: View {
    let icon: String
    let title: String
    let description: String

    init(_ title: String, systemImage icon: String, description: String) {
        self.title = title
        self.icon = icon
        self.description = description
    }

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 48))
                .foregroundColor(.secondary)

            Text(title)
                .font(.title2)
                .fontWeight(.semibold)

            Text(description)
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(40)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

#Preview {
    EmptyStateView(
        "No Tasks",
        systemImage: "checklist",
        description: "Create your first task to get started"
    )
}
