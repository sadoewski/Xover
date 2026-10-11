#!/usr/bin/env python3
import re
import uuid

project_path = "Xover.xcodeproj/project.pbxproj"

def gen_uuid():
    return uuid.uuid4().hex[:24].upper()

with open(project_path, 'r') as f:
    content = f.read()

# Generate new IDs for DataTasksView
datatasks_file_ref = f"DTFILE{gen_uuid()[:18]}"
datatasks_build_file = f"DTBUILD{gen_uuid()[:17]}"

# Add DataTasksView to PBXBuildFile section
datatasks_build = f"\t\t{datatasks_build_file} /* DataTasksView.swift in Sources */ = {{isa = PBXBuildFile; fileRef = {datatasks_file_ref} /* DataTasksView.swift */; }};\n"
content = content.replace('/* End PBXBuildFile section */', datatasks_build + '/* End PBXBuildFile section */')

# Add DataTasksView to PBXFileReference section
datatasks_ref = f"\t\t{datatasks_file_ref} /* DataTasksView.swift */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = DataTasksView.swift; sourceTree = \"<group>\"; }};\n"
content = content.replace('/* End PBXFileReference section */', datatasks_ref + '/* End PBXFileReference section */')

# Add DataTasksView to Sources build phase
datatasks_source = f"\t\t\t\t{datatasks_build_file} /* DataTasksView.swift in Sources */,\n"
# Find the Sources section and add it after AppState.swift
content = re.sub(
    r'(A9E5DEB3307BC5AD000288BA /\* AppState\.swift \*/,)',
    r'\1\n' + datatasks_source,
    content
)

# Fix DataTasks group to use correct file reference
content = re.sub(
    r'(GRP81E06E4555934E6DB4922 /\* DataTasks \*/ = \{\s+isa = PBXGroup;\s+children = \(\s+)A9E5DED0307BC5AD000288BA /\* DataTasksView\.swift \*/,',
    r'\1' + datatasks_file_ref + ' /* DataTasksView.swift */,',
    content
)

with open(project_path, 'w') as f:
    f.write(content)

print("Fixed DataTasksView references!")
print(f"File Ref: {datatasks_file_ref}")
print(f"Build File: {datatasks_build_file}")
