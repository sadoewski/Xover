#!/usr/bin/env python3
"""
Script to add new Swift files to Xcode project
"""

import uuid
import re

# Files to add
new_files = [
    ("Xover/Models/Group.swift", "Models"),
    ("Xover/Models/Template.swift", "Models"),
    ("Xover/Models/Event.swift", "Models"),
    ("Xover/Views/Groups/GroupsView.swift", "Groups"),
    ("Xover/Views/Priorities/PrioritiesView.swift", "Priorities"),
    ("Xover/Views/Templates/TemplatesView.swift", "Templates"),
    ("Xover/Views/Events/EventsView.swift", "Events"),
]

def generate_uuid():
    """Generate a UUID in the same format as Xcode"""
    return uuid.uuid4().hex[:24].upper()

def add_files_to_project(project_path):
    """Add files to Xcode project"""

    with open(project_path, 'r') as f:
        content = f.read()

    # Generate UUIDs for each file
    file_refs = {}
    build_files = {}

    for file_path, group in new_files:
        file_name = file_path.split('/')[-1]
        file_ref_id = f"A9FILE{generate_uuid()[:18]}"
        build_file_id = f"A9BUILD{generate_uuid()[:17]}"

        file_refs[file_path] = file_ref_id
        build_files[file_path] = build_file_id

        # Add to PBXBuildFile section
        build_file_entry = f'\t\t{build_file_id} /* {file_name} in Sources */ = {{isa = PBXBuildFile; fileRef = {file_ref_id} /* {file_name} */; }};\n'

        # Find the end of PBXBuildFile section
        build_file_match = re.search(r'(/\* End PBXBuildFile section \*/)', content)
        if build_file_match:
            pos = build_file_match.start()
            content = content[:pos] + build_file_entry + content[pos:]

        # Add to PBXFileReference section
        file_ref_entry = f'\t\t{file_ref_id} /* {file_name} */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = {file_name}; sourceTree = "<group>"; }};\n'

        file_ref_match = re.search(r'(/\* End PBXFileReference section \*/)', content)
        if file_ref_match:
            pos = file_ref_match.start()
            content = content[:pos] + file_ref_entry + content[pos:]

        # Add to PBXSourcesBuildPhase section
        sources_entry = f'\t\t\t\t{build_file_id} /* {file_name} in Sources */,\n'

        sources_match = re.search(r'(A9E5DEB3307BC5AD000288BA /\* AppState\.swift \*/,)', content)
        if sources_match:
            pos = sources_match.end()
            content = content[:pos] + '\n' + sources_entry + content[pos:]

    # Write back
    with open(project_path, 'w') as f:
        f.write(content)

    print("Files added to Xcode project successfully!")
    print("\nAdded files:")
    for file_path, _ in new_files:
        print(f"  - {file_path}")

if __name__ == "__main__":
    project_path = "/Users/sadoewski/projects/hostprint/macos-app/Xover.xcodeproj/project.pbxproj"
    add_files_to_project(project_path)
