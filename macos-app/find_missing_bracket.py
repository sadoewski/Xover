#!/usr/bin/env python3

project_path = "Xover.xcodeproj/project.pbxproj"

with open(project_path, 'r') as f:
    lines = f.readlines()

sections = []
current_section = None
depth = 0
section_start_depth = 0

for i, line in enumerate(lines, 1):
    # Track depth changes
    for char in line:
        if char in '{(':
            depth += 1
        elif char in '})':
            depth -= 1
    
    # Detect section starts
    if '/* Begin' in line:
        current_section = line.strip()
        section_start_depth = depth
        sections.append({
            'name': current_section,
            'start_line': i,
            'start_depth': section_start_depth,
            'end_line': None,
            'end_depth': None
        })
    
    # Detect section ends
    if '/* End' in line and sections:
        sections[-1]['end_line'] = i
        sections[-1]['end_depth'] = depth

print("Section analysis:")
print("=" * 80)

for section in sections:
    expected_depth = section['start_depth']
    actual_depth = section['end_depth']
    status = "✅" if expected_depth == actual_depth else "❌"
    
    print(f"{status} {section['name'][:50]}")
    print(f"   Lines {section['start_line']}-{section['end_line']}")
    print(f"   Start depth: {section['start_depth']}, End depth: {section['end_depth']}")
    
    if expected_depth != actual_depth:
        print(f"   ⚠️  MISMATCH! Difference: {actual_depth - expected_depth}")
    print()

print(f"\nFinal depth: {depth}")
print(f"Expected: 0")

if depth != 0:
    print(f"\n❌ File is missing {depth} closing bracket(s)")
