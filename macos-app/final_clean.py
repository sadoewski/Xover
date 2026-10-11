#!/usr/bin/env python3
import re

project_path = "Xover.xcodeproj/project.pbxproj"

with open(project_path, 'r') as f:
    lines = f.readlines()

# Reconstruct the file, removing all invalid group definitions
output = []
i = 0

while i < len(lines):
    line = lines[i]
    
    # Skip duplicate/broken VG group definitions
    if re.search(r'VG[A-F0-9]+ /\* (Groups|Priorities|Templates|Events) \*/ = {', line):
        # Skip this line and the entire group definition until sourceTree
        j = i + 1
        while j < len(lines) and 'sourceTree' not in lines[j]:
            j += 1
        i = j + 1
        continue
    
    # Skip old GRP entries for new groups  
    if re.search(r'GRP[A-F0-9]+ /\* (Groups|Priorities|Templates|Events|DataTasks) \*/ = {', line):
        # Skip this line and the entire group definition
        j = i + 1
        while j < len(lines) and 'sourceTree' not in lines[j]:
            j += 1
        i = j + 1
        continue
    
    # Skip broken FILEDCC file reference
    if 'FILEDCC3A2FFFA28496ABA27' in line or 'VF' in line and '/* EventsView' in line:
        i += 1
        continue
    
    output.append(line)
    i += 1

with open(project_path, 'w') as f:
    f.writelines(output)

print("✅ Cleaned duplicate entries")
