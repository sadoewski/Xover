//
//  RWPrintView.swift
//  Xover
//
//  Placeholder для функционала печати
//

import SwiftUI

struct RWPrintView: View {
    var body: some View {
        EmptyStateView(
            "RWPrint Integration",
            systemImage: "printer.fill",
            description: "Print management features coming soon"
        )
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(NSColor.windowBackgroundColor))
    }
}

#Preview {
    RWPrintView()
}
