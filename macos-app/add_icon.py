#!/usr/bin/env python3
"""
Add AppIcon.icns to Xcode project
"""
import re
import sys

PROJECT_FILE = "Xover.xcodeproj/project.pbxproj"
ICON_PATH = "AppIcon.icns"

# UUIDs for new entries
FILE_REF_UUID = "A1IC00000000000000000001"
BUILD_FILE_UUID = "A1IC00000000000000000002"

def main():
    print("📦 Adding AppIcon.icns to Xcode project")
    print("=" * 50)

    # Read project file
    with open(PROJECT_FILE, 'r') as f:
        content = f.read()

    # Check if already added
    if ICON_PATH in content and FILE_REF_UUID in content:
        print("✓ AppIcon.icns already in project")
        return 0

    # Backup
    with open(PROJECT_FILE + ".backup", 'w') as f:
        f.write(content)
    print("✓ Created backup")

    # 1. Add PBXBuildFile entry
    build_file_entry = f'\t\t{BUILD_FILE_UUID} /* {ICON_PATH} in Resources */ = {{isa = PBXBuildFile; fileRef = {FILE_REF_UUID} /* {ICON_PATH} */; }};\n'

    # Find PBXBuildFile section and add after first entry
    pattern = r'(/\* Begin PBXBuildFile section \*/\n)'
    content = re.sub(pattern, r'\1' + build_file_entry, content, count=1)
    print("✓ Added PBXBuildFile")

    # 2. Add PBXFileReference entry
    file_ref_entry = f'\t\t{FILE_REF_UUID} /* {ICON_PATH} */ = {{isa = PBXFileReference; lastKnownFileType = image.icns; path = {ICON_PATH}; sourceTree = "<group>"; }};\n'

    # Find PBXFileReference section and add after first entry
    pattern = r'(/\* Begin PBXFileReference section \*/\n)'
    content = re.sub(pattern, r'\1' + file_ref_entry, content, count=1)
    print("✓ Added PBXFileReference")

    # 3. Add to PBXGroup (Xover group - find by looking for Info.plist)
    # Find the children array of Xover group
    pattern = r'(A10000001BAA000000000006 /\* Info\.plist \*/,\n)'
    replacement = r'\1\t\t\t\t' + FILE_REF_UUID + ' /* ' + ICON_PATH + ' */,\n'
    content = re.sub(pattern, replacement, content, count=1)
    print("✓ Added to PBXGroup")

    # 4. Add to PBXResourcesBuildPhase
    pattern = r'(A10000001BAB000000000003 /\* Assets\.xcassets in Resources \*/,\n)'
    replacement = r'\1\t\t\t\t' + BUILD_FILE_UUID + ' /* ' + ICON_PATH + ' in Resources */,\n'
    content = re.sub(pattern, replacement, content, count=1)
    print("✓ Added to Resources Build Phase")

    # Write back
    with open(PROJECT_FILE, 'w') as f:
        f.write(content)

    print("")
    print("=" * 50)
    print("✅ AppIcon.icns added to project!")
    print("")
    print("Next steps:")
    print("  1. Open Xover.xcodeproj in Xcode")
    print("  2. Clean Build (Cmd+Shift+K)")
    print("  3. Build (Cmd+B)")
    print("  4. Run (Cmd+R)")
    print("")
    return 0

if __name__ == "__main__":
    sys.exit(main())
