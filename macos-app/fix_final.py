#!/usr/bin/env python3

project_path = "Xover.xcodeproj/project.pbxproj"

with open(project_path, 'r') as f:
    content = f.read()

# The correct ending should be:
# /* End XCConfigurationList section */
#     };  <- closes objects dictionary
#     rootObject = ...;
# }  <- closes main dictionary

correct_ending = """/* End XCConfigurationList section */
	};
	rootObject = A10000001BA7000000000002 /* Project object */;
}
"""

# Replace the current ending
content = content.replace(
    """/* End XCConfigurationList section */
	};
	rootObject = A10000001BA7000000000002 /* Project object */;
}""",
    correct_ending
)

with open(project_path, 'w') as f:
    f.write(content)

print("✅ Fixed file structure!")
