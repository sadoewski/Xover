#!/usr/bin/env python3
import re
import uuid

project_path = "Xover.xcodeproj/project.pbxproj"

def gen_uuid():
    return uuid.uuid4().hex[:24].upper()

with open(project_path, 'r') as f:
    content = f.read()

# Generate UUIDs for new groups
groups_group_id = f"GRP{gen_uuid()[:21]}"
priorities_group_id = f"GRP{gen_uuid()[:21]}"
templates_group_id = f"GRP{gen_uuid()[:21]}"
events_group_id = f"GRP{gen_uuid()[:21]}"
datatasks_group_id = f"GRP{gen_uuid()[:21]}"

# Add new groups to Views section
views_update = f"""		A9E5DECE307BC5AD000288BA /* Views */ = {{
			isa = PBXGroup;
			children = (
				A9E5DEBA307BC5AD000288BA /* Auth */,
				A9E5DEBD307BC5AD000288BA /* Calendar */,
				A9E5DEBF307BC5AD000288BA /* Dashboard */,
				{datatasks_group_id} /* DataTasks */,
				{events_group_id} /* Events */,
				{groups_group_id} /* Groups */,
				A9E5DEC0307BC5AD000288BA /* Inspector */,
				{priorities_group_id} /* Priorities */,
				A9E5DEC2307BC5AD000288BA /* RWPrint */,
				A9E5DEC5307BC5AD000288BA /* Settings */,
				A9E5DEC7307BC5AD000288BA /* Sidebar */,
				A9E5DECA307BC5AD000288BA /* Tasks */,
				{templates_group_id} /* Templates */,
				A9E5DECC307BC5AD000288BA /* Terminal */,
				A9E5DECD307BC5AD000288BA /* MainWindowView.swift */,
			);
			path = Views;
			sourceTree = "<group>";
		}};"""

# Replace Views section
pattern = r'A9E5DECE307BC5AD000288BA /\* Views \*/ = \{[^}]+\};'
content = re.sub(pattern, views_update.strip(), content, flags=re.DOTALL)

# Add group definitions before /* End PBXGroup section */
new_groups = f"""		{groups_group_id} /* Groups */ = {{
			isa = PBXGroup;
			children = (
				A9FILEA3614DD835844B7E95 /* GroupsView.swift */,
			);
			path = Groups;
			sourceTree = "<group>";
		}};
		{priorities_group_id} /* Priorities */ = {{
			isa = PBXGroup;
			children = (
				A9FILEA92EFF8596AA421FB7 /* PrioritiesView.swift */,
			);
			path = Priorities;
			sourceTree = "<group>";
		}};
		{templates_group_id} /* Templates */ = {{
			isa = PBXGroup;
			children = (
				A9FILECFC576932497465895 /* TemplatesView.swift */,
			);
			path = Templates;
			sourceTree = "<group>";
		}};
		{events_group_id} /* Events */ = {{
			isa = PBXGroup;
			children = (
				A9FILE31C2EB621780413189 /* EventsView.swift */,
			);
			path = Events;
			sourceTree = "<group>";
		}};
		{datatasks_group_id} /* DataTasks */ = {{
			isa = PBXGroup;
			children = (
				A9E5DED0307BC5AD000288BA /* DataTasksView.swift */,
			);
			path = DataTasks;
			sourceTree = "<group>";
		}};
"""

# Insert before /* End PBXGroup section */
content = content.replace('/* End PBXGroup section */', new_groups + '/* End PBXGroup section */')

with open(project_path, 'w') as f:
    f.write(content)

print("Successfully added all view groups!")
print(f"Groups ID: {groups_group_id}")
print(f"Priorities ID: {priorities_group_id}")
print(f"Templates ID: {templates_group_id}")
print(f"Events ID: {events_group_id}")
print(f"DataTasks ID: {datatasks_group_id}")
