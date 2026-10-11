#!/usr/bin/env python3
import re
import uuid

project_path = "Xover.xcodeproj/project.pbxproj"

def gen_uuid():
    return uuid.uuid4().hex[:24].upper()

# Model files to add
model_files = [
    'Group.swift',
    'Template.swift', 
    'Event.swift',
]

# View files and their groups
view_files = {
    'Groups': 'GroupsView.swift',
    'Priorities': 'PrioritiesView.swift',
    'Templates': 'TemplatesView.swift',
    'Events': 'EventsView.swift',
}

with open(project_path, 'r') as f:
    content = f.read()

print("Step 1: Adding Model files...")

# Generate IDs and add models
model_file_refs = {}
model_build_files = {}

for filename in model_files:
    file_ref = f"MF{gen_uuid()[:22]}"
    build_file = f"MB{gen_uuid()[:22]}"
    
    model_file_refs[filename] = file_ref
    model_build_files[filename] = build_file
    
    # Add PBXFileReference
    file_ref_entry = f"\t\t{file_ref} /* {filename} */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = {filename}; sourceTree = \"<group>\"; }};\n"
    
    # Find PBXFileReference section and add before "End PBXFileReference"
    content = content.replace(
        '/* End PBXFileReference section */',
        file_ref_entry + '/* End PBXFileReference section */'
    )
    
    # Add PBXBuildFile
    build_file_entry = f"\t\t{build_file} /* {filename} in Sources */ = {{isa = PBXBuildFile; fileRef = {file_ref} /* {filename} */; }};\n"
    
    content = content.replace(
        '/* End PBXBuildFile section */',
        build_file_entry + '/* End PBXBuildFile section */'
    )
    
    print(f"  ✓ {filename}")

# Update Models group to include new files
models_children = "\t\t\t\tA9E5DEB3307BC5AD000288BA /* AppState.swift */,\n"
for filename in model_files:
    models_children += f"\t\t\t\t{model_file_refs[filename]} /* {filename} */,\n"
models_children += "\t\t\t\tA9E5DEB4307BC5AD000288BA /* Task.swift */,\n"
models_children += "\t\t\t\tA9E5DEB5307BC5AD000288BA /* User.swift */,"

models_section = f"""		A9E5DEB6307BC5AD000288BA /* Models */ = {{
			isa = PBXGroup;
			children = (
{models_children}
			);
			path = Models;
			sourceTree = "<group>";
		}};"""

content = re.sub(
    r'A9E5DEB6307BC5AD000288BA /\* Models \*/ = \{.*?\n\t\t\};',
    models_section,
    content,
    flags=re.DOTALL
)

print("\nStep 2: Adding View groups and files...")

# Create view groups
view_group_ids = {}
view_file_refs = {}
view_build_files = {}

for group_name, filename in view_files.items():
    group_id = f"VG{gen_uuid()[:22]}"
    file_ref = f"VF{gen_uuid()[:22]}"
    build_file = f"VB{gen_uuid()[:22]}"
    
    view_group_ids[group_name] = group_id
    view_file_refs[filename] = file_ref
    view_build_files[filename] = build_file
    
    # Add PBXFileReference
    file_ref_entry = f"\t\t{file_ref} /* {filename} */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = {filename}; sourceTree = \"<group>\"; }};\n"
    content = content.replace(
        '/* End PBXFileReference section */',
        file_ref_entry + '/* End PBXFileReference section */'
    )
    
    # Add PBXBuildFile
    build_file_entry = f"\t\t{build_file} /* {filename} in Sources */ = {{isa = PBXBuildFile; fileRef = {file_ref} /* {filename} */; }};\n"
    content = content.replace(
        '/* End PBXBuildFile section */',
        build_file_entry + '/* End PBXBuildFile section */'
    )
    
    # Create group definition
    group_def = f"""		{group_id} /* {group_name} */ = {{
			isa = PBXGroup;
			children = (
				{file_ref} /* {filename} */,
			);
			path = {group_name};
			sourceTree = "<group>";
		}};
"""
    
    # Add before End PBXGroup section
    content = content.replace(
        '/* End PBXGroup section */',
        group_def + '/* End PBXGroup section */'
    )
    
    print(f"  ✓ {group_name}/{filename}")

# Update Views group
views_children = """				A9E5DEBA307BC5AD000288BA /* Auth */,
				A9E5DEBD307BC5AD000288BA /* Calendar */,
				A9E5DEBF307BC5AD000288BA /* Dashboard */,
"""

for group_name in sorted(view_files.keys()):
    views_children += f"\t\t\t\t{view_group_ids[group_name]} /* {group_name} */,\n"

views_children += """				A9E5DEC0307BC5AD000288BA /* Inspector */,
				A9E5DEC2307BC5AD000288BA /* RWPrint */,
				A9E5DEC5307BC5AD000288BA /* Settings */,
				A9E5DEC7307BC5AD000288BA /* Sidebar */,
				A9E5DECA307BC5AD000288BA /* Tasks */,
				A9E5DECC307BC5AD000288BA /* Terminal */,
				A9E5DECD307BC5AD000288BA /* MainWindowView.swift */,"""

views_section = f"""		A9E5DECE307BC5AD000288BA /* Views */ = {{
			isa = PBXGroup;
			children = (
{views_children}
			);
			path = Views;
			sourceTree = "<group>";
		}};"""

content = re.sub(
    r'A9E5DECE307BC5AD000288BA /\* Views \*/ = \{.*?\n\t\t\};',
    views_section,
    content,
    flags=re.DOTALL
)

print("\nStep 3: Adding to Sources build phase...")

# Find the Sources section and add all build files
sources_additions = ""
for filename in model_files:
    sources_additions += f"\t\t\t\t{model_build_files[filename]} /* {filename} in Sources */,\n"

for filename in view_files.values():
    sources_additions += f"\t\t\t\t{view_build_files[filename]} /* {filename} in Sources */,\n"

# Add after AppState.swift in Sources
content = re.sub(
    r'(A9E5DEB3307BC5AD000288BA /\* AppState\.swift in Sources \*/,)',
    r'\1\n' + sources_additions,
    content
)

with open(project_path, 'w') as f:
    f.write(content)

print("\n✅ All files added successfully!")
print("\nYou can now open the project in Xcode:")
print("  open Xover.xcodeproj")
