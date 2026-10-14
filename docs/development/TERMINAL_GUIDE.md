# Xover Terminal Guide

## Overview
Xover Terminal is a command-line interface for interacting with the task management system. All commands support UTF-8 encoding for Russian text display.

## Access
Navigate to **Shell** in the Xover sidebar or go to `/terminal` route.

## Command Structure

### Prompt Format
- Root: `xover@username:`
- Context: `xover@username>task:`
- Specific task: `xover@username>task>id:5:`

### Navigation Commands

#### `mv <target>`
Move to a different context:
- `mv task` - Enter task context
- `mv events` - Enter events context
- `mv dt` - Enter datatask context
- `mv id:5` - Enter specific task context (from task context)
- `mv ..` - Go back one level

#### `exit`
- `exit` - Go back one level
- `exit -a` - Return to root from anywhere

### Display Commands

#### `show board`
Display admin panel statistics for today

#### `show today`
Show all tasks for today
- `show today -a` - Awaiting tasks only
- `show today -p` - In progress tasks only
- `show today -c` - Completed tasks only
- `show today -d` - Cancelled tasks only
- `show today -ex` - Postponed tasks only
- `show today ++` - Today and tomorrow
- `show today --` - Yesterday and today
- `show today -v` - Verbose view with full details

#### `show <date>`
Show tasks for specific date (DD.MM.YYYY format)
- `show 15.10.2026`
- `show 15.10.2026 -a` - Filter by status

#### `show ++` / `show month` / `show year`
- `show ++` - Week view (only dates with tasks)
- `show month` - Month view (only dates with tasks)
- `show year` - Year view (only dates with tasks)

All support status flags: `-a`, `-p`, `-c`, `-d`, `-ex`

#### `show slot <date|today>`
Show only time-bound tasks
- `show slot today`
- `show slot 15.10.2026`

#### `show dt`
Display all datatasks with task count

#### `show events`
Show events (requires flag):
- `show events -c` - Current month events
- `show events -p` - Past events this year
- `show events -f` - Future events this year
- `show events -a` - All events this year

### Task Commands (in `>task` context)

#### `id:<number> -rm`
Delete task by ID
- `id:5 -rm` - Delete task #5

#### `id:<number> -v`
View task properties (verbose)
- `id:5 -v` - Show all details for task #5

#### `id:<number> --link`
Manage task links (comments)
- `id:5 --link` - List all links
- `id:5 --link -a "https://example.com"` - Add new link
- `id:5 --link 1 -rm` - Remove link #1

#### `id:<number> --status`
Manage task status
- `id:5 --status` - Show current status
- `id:5 --status -p` - Set to "in progress"
- `id:5 --status -c` - Set to "completed"
- `id:5 --status -d` - Set to "cancelled"
- `id:5 --status -a` - Set to "awaiting"
- `id:5 --status -ex 20.10.2026` - Postpone to date

### Contextual Commands

When in `>task>id:5` context, you can omit the `id:5` prefix:
```
xover@admin>task>id:5: --status
xover@admin>task>id:5: --link
xover@admin>task>id:5: -v
xover@admin>task>id:5: -rm
```

### Help Commands

#### `help`
Show all available commands

#### `help --now`
Show commands available in current context

#### `<command> ?`
Show options for specific command
- `show ?` - List all show options
- `mv ?` - List all movement options

## Command History
- **↑** (Arrow Up) - Navigate to previous command
- **↓** (Arrow Down) - Navigate to next command

## Output Formats

### Card Format
Used for verbose task views (`-v` flag):
```
┌──────────────────────────────────────┐
│ Task #5
├──────────────────────────────────────┤
│ Name: Review documentation
│ Group: Work
│ Tag: Development
│ Status: in progress
│ Priority: High
│ Created: 10.10.2026
└──────────────────────────────────────┘
```

### List Format
Used for basic task lists:
```
#5 - Review documentation - in progress
#6 - Update tests - awaiting
#7 - Deploy to production [14:00 - 16:00] - completed
```

### Empty States
- `No tasks for today` - No tasks found for specified date
- `Shell has nothing to display` - No data for general queries
- `No links found` - Task has no links
- `Invalid date` - Date format error

## Error Messages

All error messages are in English and include hints:
- Missing required flag: Shows available flags
- Invalid command: Suggests similar commands
- Date format error: Shows `Invalid date`
- Task not found: `Task not found`

## Status Labels

Internal status → Display label:
- `pending` → awaiting
- `in_progress` → in progress
- `completed` → completed
- `cancelled` → cancelled
- `moved` → postponed

## Examples

### Daily workflow
```bash
# Check today's tasks
show today

# Filter by status
show today -p

# View specific task details
mv task
id:5 -v

# Update task status
id:5 --status -c

# Return to root
exit -a
```

### Weekly planning
```bash
# View week
show ++

# Check specific date
show 15.10.2026 -v

# View time-bound tasks
show slot today
```

### Task management
```bash
# Enter task context
mv task

# Navigate to specific task
mv id:5

# Add link
--link -a "https://docs.example.com"

# Check status
--status

# Update and return
--status -c
exit -a
```

## Tips

1. Use `?` after any command to see options
2. Use `help --now` to see context-specific commands
3. Command history persists during session
4. Terminal supports full UTF-8 for Russian text
5. All commands are case-insensitive
6. Date format is always DD.MM.YYYY
7. Use `-v` flag for detailed card view
