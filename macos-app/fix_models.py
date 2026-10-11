#!/usr/bin/env python3
import re

project_path = "Xover.xcodeproj/project.pbxproj"

with open(project_path, 'r') as f:
    content = f.read()

# Find Models group and add the file references
models_section = """		A9E5DEB6307BC5AD000288BA /* Models */ = {
			isa = PBXGroup;
			children = (
				A9E5DEB3307BC5AD000288BA /* AppState.swift */,
				A9FILEC57A8E65196D47D1A0 /* Group.swift */,
				A9FILEDFD39B05E1594C87B5 /* Template.swift */,
				A9FILE36CB893E75684536B1 /* Event.swift */,
				A9E5DEB4307BC5AD000288BA /* Task.swift */,
				A9E5DEB5307BC5AD000288BA /* User.swift */,
			);
			path = Models;
			sourceTree = "<group>";
		};"""

# Replace the Models section
pattern = r'A9E5DEB6307BC5AD000288BA /\* Models \*/ = \{[^}]+\};'
content = re.sub(pattern, models_section.strip(), content, flags=re.DOTALL)

with open(project_path, 'w') as f:
    f.write(content)

print("Fixed Models group with correct file references!")
