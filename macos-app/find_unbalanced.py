#!/usr/bin/env python3

project_path = "Xover.xcodeproj/project.pbxproj"

with open(project_path, 'r') as f:
    lines = f.readlines()

brace_depth = 0
paren_depth = 0

for i, line in enumerate(lines, 1):
    for char in line:
        if char == '{':
            brace_depth += 1
        elif char == '}':
            brace_depth -= 1
        elif char == '(':
            paren_depth += 1
        elif char == ')':
            paren_depth -= 1
            
    if brace_depth < 0:
        print(f"Line {i}: Too many closing braces! Depth: {brace_depth}")
        print(f"  {line.strip()}")
    if paren_depth < 0:
        print(f"Line {i}: Too many closing parens! Depth: {paren_depth}")
        print(f"  {line.strip()}")

print(f"\nFinal brace depth: {brace_depth}")
print(f"Final paren depth: {paren_depth}")

# Find where we're missing closing
if brace_depth > 0:
    print(f"\n⚠️ Missing {brace_depth} closing brace(s)")
if paren_depth > 0:
    print(f"⚠️ Missing {paren_depth} closing paren(s)")
    
# Show last 20 lines
print("\nLast 20 lines of file:")
print("=" * 60)
for line in lines[-20:]:
    print(line.rstrip())
