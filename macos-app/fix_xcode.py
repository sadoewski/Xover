#!/usr/bin/env python3
import re

project_path = "Xover.xcodeproj/project.pbxproj"

with open(project_path, 'r') as f:
    content = f.read()

# Find the Models group section
models_pattern = r'(A9E5DEB6307BC5AD000288BA /\* Models \*/ = \{\s+isa = PBXGroup;\s+children = \(\s+A9E5DEB3307BC5AD000288BA /\* AppState\.swift \*/,)'
models_pattern += r'(.*?)'
models_pattern += r'(A9E5DEB4307BC5AD000288BA /\* Task\.swift \*/,\s+A9E5DEB5307BC5AD000288BA /\* User\.swift \*/,)'

# Find all A9BUILD entries in Models group
wrong_entries = re.findall(r'A9BUILD[A-Z0-9]+ /\*.*?\*/,\s*', content)

# Remove all A9BUILD entries from Models section
for entry in wrong_entries:
    content = content.replace(entry, '')

# Also remove empty lines
content = re.sub(r'\n\n+', '\n', content)

with open(project_path, 'w') as f:
    f.write(content)

print("Fixed Models group!")
