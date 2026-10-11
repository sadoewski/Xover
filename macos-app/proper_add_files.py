#!/usr/bin/env python3
import re
import uuid

project_path = "Xover.xcodeproj/project.pbxproj"

def gen_uuid():
    return uuid.uuid4().hex[:24].upper()

# Files to add
files_to_add = [
    {
        'name': 'Group.swift',
        'path': 'Xover/Models/Group.swift',
        'group': 'Models',
        'group_id': 'A9E5DEB6307BC5AD000288BA'
    },
    {
        'name': 'Template.swift',
        'path': 'Xover/Models/Template.swift',
        'group': 'Models',
        'group_id': 'A9E5DEB6307BC5AD000288BA'
    },
    {
        'name': 'Event.swift',
        'path': 'Xover/Models/Event.swift',
        'group': 'Models',
        'group_id': 'A9E5DEB6307BC5AD000288BA'
    },
]

# New view groups to create
new_view_groups = [
    {
        'name': 'Groups',
        'id': f"GRP{gen_uuid()[:21]}",
        'files': ['GroupsView.swift']
    },
    {
        'name': 'Priorities',
        'id': f"GRP{gen_uuid()[:21]}",
        'files': ['PrioritiesView.swift']
    },
    {
        'name': 'Templates',
        'id': f"GRP{gen_uuid()[:21]}",
        'files': ['TemplatesView.swift']
    },
    {
        'name': 'Events',
        'id': f"GRP{gen_uuid()[:21]}",
        'files': ['EventsView.swift']
    },
]

with open(project_path, 'r') as f:
    content = f.read()

# Step 1: Add PBXBuildFile and PBXFileReference entries
file_refs = {}
build_files = {}

for file_info in files_to_add:
    file_ref_id = f"FILE{gen_uuid()[:20]}"
    build_file_id = f"BUILD{gen_uuid()[:19]}"
    
    file_refs[file_info['name']] = file_ref_id
    build_files[file_info['name']] = build_file_id
    
    # Add PBXBuildFile
    build_entry = f"\t\t{build_file_id} /* {file_info['name']} in Sources */ = {{isa = PBXBuildFile; fileRef = {file_ref_id} /* {file_info['name']} */; }};\n"
    content = content.replace('/* End PBXBuildFile section */', build_entry + '/* End PBXBuildFile section */')
    
    # Add PBXFileReference
    ref_entry = f"\t\t{file_ref_id} /* {file_info['name']} */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = {file_info['name']}; sourceTree = \"<group>\"; }};\n"
    content = content.replace('/* End PBXFileReference section */', ref_entry + '/* End PBXFileReference section */')
    
    # Add to Sources build phase
    source_entry = f"\t\t\t\t{build_file_id} /* {file_info['name']} in Sources */,\n"
    content = re.sub(
        r'(A9E5DEB3307BC5AD000288BA /\* AppState\.swift in Sources \*/,)',
        r'\1\n' + source_entry,
        content
    )

# Step 2: Add file references to Models group
models_pattern = r'(A9E5DEB6307BC5AD000288BA /\* Models \*/ = \{\s+isa = PBXGroup;\s+children = \(\s+A9E5DEB3307BC5AD000288BA /\* AppState\.swift \*/,)'
models_additions = ""
for file_info in files_to_add:
    if file_info['group'] == 'Models':
        file_ref_id = file_refs[file_info['name']]
        models_additions += f"\n\t\t\t\t{file_ref_id} /* {file_info['name']} */,"

content = re.sub(models_pattern, r'\1' + models_additions, content)

# Step 3: Create new view groups with their file references
for group_info in new_view_groups:
    file_ref_id = f"FILE{gen_uuid()[:20]}"
    build_file_id = f"BUILD{gen_uuid()[:19]}"
    file_name = group_info['files'][0]
    
    # Store IDs
    group_info['file_ref_id'] = file_ref_id
    group_info['build_file_id'] = build_file_id
    
    # Add PBXBuildFile
    build_entry = f"\t\t{build_file_id} /* {file_name} in Sources */ = {{isa = PBXBuildFile; fileRef = {file_ref_id} /* {file_name} */; }};\n"
    content = content.replace('/* End PBXBuildFile section */', build_entry + '/* End PBXBuildFile section */')
    
    # Add PBXFileReference
    ref_entry = f"\t\t{file_ref_id} /* {file_name} */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = {file_name}; sourceTree = \"<group>\"; }};\n"
    content = content.replace('/* End PBXFileReference section */', ref_entry + '/* End PBXFileReference section */')
    
    # Add to Sources build phase
    source_entry = f"\t\t\t\t{build_file_id} /* {file_name} in Sources */,\n"
    content = re.sub(
        r'(A9E5DEB3307BC5AD000288BA /\* AppState\.swift in Sources \*/,)',
        r'\1\n' + source_entry,
        content
    )

# Step 4: Create group definitions
groups_section = ""
for group_info in new_view_groups:
    groups_section += f"""		{group_info['id']} /* {group_info['name']} */ = {{
			isa = PBXGroup;
			children = (
				{group_info['file_ref_id']} /* {group_info['files'][0]} */,
			);
			path = {group_info['name']};
			sourceTree = "<group>";
		}};
"""

content = content.replace('/* End PBXGroup section */', groups_section + '/* End PBXGroup section */')

# Step 5: Add new groups to Views group
views_pattern = r'(A9E5DECE307BC5AD000288BA /\* Views \*/ = \{\s+isa = PBXGroup;\s+children = \()'
views_additions = ""
for group_info in new_view_groups:
    views_additions += f"\n\t\t\t\t{group_info['id']} /* {group_info['name']} */,"

# Insert alphabetically in Views
views_section = """				A9E5DEBA307BC5AD000288BA /* Auth */,
				A9E5DEBD307BC5AD000288BA /* Calendar */,
				A9E5DEBF307BC5AD000288BA /* Dashboard */,
				A9E5DEC0307BC5AD000288BA /* Inspector */,"""

for group_info in new_view_groups:
    views_section += f"\n\t\t\t\t{group_info['id']} /* {group_info['name']} */,"

views_section += """
				A9E5DEC2307BC5AD000288BA /* RWPrint */,
				A9E5DEC5307BC5AD000288BA /* Settings */,
				A9E5DEC7307BC5AD000288BA /* Sidebar */,
				A9E5DECA307BC5AD000288BA /* Tasks */,
				A9E5DECC307BC5AD000288BA /* Terminal */,
				A9E5DECD307BC5AD000288BA /* MainWindowView.swift */,"""

replacement = f"""		A9E5DECE307BC5AD000288BA /* Views */ = {{
			isa = PBXGroup;
			children = (
{views_section}
			);
			path = Views;
			sourceTree = "<group>";
		}};"""

content = re.sub(
    r'A9E5DECE307BC5AD000288BA /\* Views \*/ = \{[^}]+\};',
    replacement,
    content,
    flags=re.DOTALL
)

with open(project_path, 'w') as f:
    f.write(content)

print("✅ Successfully added all files to Xcode project!")
print("\nAdded Models:")
for file_info in files_to_add:
    print(f"  - {file_info['name']}")
print("\nAdded View Groups:")
for group_info in new_view_groups:
    print(f"  - {group_info['name']}/{group_info['files'][0]}")
