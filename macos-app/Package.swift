// swift-tools-version: 5.9
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "Xover",
    platforms: [
        .macOS(.v13)
    ],
    products: [
        .library(
            name: "Xover",
            targets: ["Xover"])
    ],
    dependencies: [
        // Add Swift package dependencies here if needed
    ],
    targets: [
        .target(
            name: "Xover",
            dependencies: [])
    ]
)
