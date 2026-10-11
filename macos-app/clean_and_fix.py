#!/usr/bin/env python3
import re

project_path = "Xover.xcodeproj/project.pbxproj"

with open(project_path, 'r') as f:
    content = f.read()

# Step 1: Remove ALL invalid entries that might have been added by previous scripts
# Find all DTBUILD, A9BUILD entries and remove them from ANYWHERE in the file
invalid_patterns = [
    r'\s*DTBUILD[A-Z0-9]+ /\*.*?\*/,?\s*',
    r'\s*A9BUILD[A-Z0-9]+ /\*.*?\.swift in Sources.*?\*/,?\s*',
    r'\s*A9FILE[A-Z0-9]+ /\*.*?\.swift\*/,?\s*',
]

print("Cleaning invalid entries...")
for pattern in invalid_patterns:
    matches = re.findall(pattern, content)
    if matches:
        print(f"Found {len(matches)} matches for pattern: {pattern[:30]}...")
        for match in matches:
            content = content.replace(match, '')

# Step 2: Remove duplicate newlines
content = re.sub(r'\n\n+', '\n', content)

# Step 3: Fix Models group section completely
print("\nFixing Models group...")

# Find where Models group should be
models_group = """		A9E5DEB6307BC5AD000288BA /* Models */ = {
			isa = PBXGroup;
			children = (
				A9E5DEB3307BC5AD000288BA /* AppState.swift */,
				A9E5DEB4307BC5AD000288BA /* Task.swift */,
				A9E5DEB5307BC5AD000288BA /* User.swift */,
			);
			path = Models;
			sourceTree = "<group>";
		};"""

# Replace any corrupted Models section
content = re.sub(
    r'A9E5DEB6307BC5AD000288BA /\* Models \*/ = \{.*?\n\t\t\};',
    models_group,
    content,
    flags=re.DOTALL
)

print("✅ Cleaned project file!")

with open(project_path, 'w') as f:
    f.write(content)

print("\nProject file cleaned. Now run add_new_files.py to add files properly.")
