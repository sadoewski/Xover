#!/usr/bin/env python3

project_path = "Xover.xcodeproj/project.pbxproj"

with open(project_path, 'r') as f:
    content = f.read()

# Find and replace the broken Models section
broken_models = """		A9E5DEB6307BC5AD000288BA /* Models */ = {
			isa = PBXGroup;
			children = (
				A9E5DEB3307BC5AD000288BA /* AppState.swift */,
		A9E5DEB8307BC5AD000288BA /* Services */ = {"""

fixed_models = """		A9E5DEB6307BC5AD000288BA /* Models */ = {
			isa = PBXGroup;
			children = (
				A9E5DEB3307BC5AD000288BA /* AppState.swift */,
				A9E5DEB4307BC5AD000288BA /* Task.swift */,
				A9E5DEB5307BC5AD000288BA /* User.swift */,
			);
			path = Models;
			sourceTree = "<group>";
		};
		A9E5DEB8307BC5AD000288BA /* Services */ = {"""

content = content.replace(broken_models, fixed_models)

with open(project_path, 'w') as f:
    f.write(content)

print("✅ Fixed Models group!")
