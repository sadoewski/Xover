#!/usr/bin/env python3

project_path = "Xover.xcodeproj/project.pbxproj"

with open(project_path, 'r') as f:
    lines = f.readlines()

depth = 0
max_depth = 0
problematic_lines = []

for i, line in enumerate(lines, 1):
    stripped = line.strip()
    
    # Track depth before processing line
    old_depth = depth
    
    for char in line:
        if char in '{(':
            depth += 1
            if depth > max_depth:
                max_depth = depth
        elif char in '})':
            depth -= 1
            
    # If depth went negative or jumped weirdly
    if depth < 0 or abs(depth - old_depth) > 3:
        problematic_lines.append((i, line.strip(), old_depth, depth))

print(f"Max depth reached: {max_depth}")
print(f"Final depth: {depth} (should be 0)")

if problematic_lines:
    print("\nProblematic lines:")
    for line_num, content, before, after in problematic_lines[:10]:
        print(f"  Line {line_num} (depth {before}→{after}): {content[:60]}")

# Find sections with issues
print("\nChecking each major section...")
current_section = None
section_depths = {}

for line in lines:
    if '/\* Begin' in line:
        current_section = line.strip()
        section_depths[current_section] = depth
    elif '/\* End' in line:
        expected_depth = section_depths.get(current_section.replace('Begin', 'End') if current_section else None, depth)
        if depth != expected_depth:
            print(f"  ⚠️ {line.strip()}: depth={depth}, expected={expected_depth}")
            
