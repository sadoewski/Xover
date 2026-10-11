#!/usr/bin/env python3
import re

project_path = "Xover.xcodeproj/project.pbxproj"

with open(project_path, 'r') as f:
    content = f.read()

print("Removing ALL A9BUILD entries...")
# Remove all A9BUILD entries from PBXBuildFile section
content = re.sub(r'\s*A9BUILD[A-Z0-9]+ /\*[^}]+\};', '', content)

print("Removing ALL A9FILE entries...")
# Remove all A9FILE entries from PBXFileReference section  
content = re.sub(r'\s*A9FILE[A-Z0-9]+ /\*[^}]+\};', '', content)

print("Cleaning up any orphaned references...")
# Remove lines that reference A9BUILD or A9FILE
lines = content.split('\n')
cleaned_lines = []
for line in lines:
    if 'A9BUILD' not in line and 'A9FILE' not in line:
        cleaned_lines.append(line)
    else:
        print(f"  Removing: {line.strip()[:80]}...")

content = '\n'.join(cleaned_lines)

# Fix multiple newlines
content = re.sub(r'\n\n\n+', '\n\n', content)

with open(project_path, 'w') as f:
    f.write(content)

print("\n✅ Project file cleaned!")
print("\nNow the project should open without errors.")
print("Add the new files manually through Xcode UI:")
print("  - Right-click on Models folder → Add Files to Xover")
print("  - Select Group.swift, Template.swift, Event.swift")
print("  - Do the same for Views groups")
