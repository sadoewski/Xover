export class CommandParser {
  static parse(input, context, contextId) {
    const trimmed = input.trim();
    if (!trimmed) {
      return { error: 'Empty command' };
    }

    // Check for autocomplete
    if (trimmed.endsWith('?')) {
      const cmd = trimmed.slice(0, -1).trim();
      return { action: 'autocomplete', command: cmd, autocomplete: true };
    }

    // Split command and flags
    const parts = trimmed.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    // Parse based on command
    switch (command) {
      case 'help':
        return this.parseHelp(args);
      case 'show':
        return this.parseShow(args, context);
      case 'mv':
        return this.parseMv(args, context);
      case 'exit':
        return this.parseExit(args);
      case 'today':
        // Handle 'today -v' in task context
        if (context === 'task') {
          return this.parseShow(['today', ...args], context);
        }
        return { error: `Unknown command: ${command}` };
      case 'id':
      default:
        if (command.startsWith('id:')) {
          return this.parseId(trimmed, context, contextId);
        }
        // Check if command is a date DD.MM.YYYY
        if (/^\d{2}\.\d{2}\.\d{4}$/.test(command)) {
          if (context === 'task') {
            return this.parseShow([command, ...args], context);
          }
        }
        // Check if we're in a task context with contextId and command is a flag
        if (context === 'task' && contextId && (command.startsWith('-') || command.startsWith('--'))) {
          // Reconstruct as id command with contextId
          return this.parseId(trimmed, context, contextId);
        }
        return { error: `Unknown command: ${command}` };
    }
  }

  static parseHelp(args) {
    return {
      action: 'help',
      flags: args
    };
  }

  static parseShow(args, context) {
    if (args.length === 0) {
      return { error: 'show requires a target. Try "show ?" for options' };
    }

    const target = args[0];
    const flags = args.slice(1);

    // Autocomplete
    if (target === '?') {
      return { action: 'show', autocomplete: true };
    }

    // Validate target
    const validTargets = ['board', 'today', 'dt', 'events', 'slot', '++', '--', 'month', 'year'];
    const isDate = /^\d{2}\.\d{2}\.\d{4}$/.test(target);

    if (!validTargets.includes(target) && !isDate) {
      return { error: `Invalid show target: ${target}. Try "show ?" for options` };
    }

    // Validate flags
    const validFlags = ['-a', '-p', '-c', '-d', '-ex', '-v', '++', '--'];
    for (const flag of flags) {
      if (!validFlags.includes(flag) && flag !== 'today' && !/^\d{2}\.\d{2}\.\d{4}$/.test(flag)) {
        return { error: `Invalid flag: ${flag}` };
      }
    }

    return {
      action: 'show',
      target,
      flags
    };
  }

  static parseMv(args, context) {
    if (args.length === 0) {
      return { error: 'mv requires a target: task, events, dt, or id:<number>' };
    }

    const target = args[0];
    const flags = args.slice(1);

    // Check for exit with -a
    if (flags.includes('-a')) {
      return {
        action: 'mv',
        target: 'root',
        flags: ['-a']
      };
    }

    // Check for .. (go back)
    if (target === '..') {
      return {
        action: 'mv',
        target: '..',
        flags: []
      };
    }

    // Check if trying to move to id:X outside task context
    if (target.startsWith('id:')) {
      if (context !== 'task') {
        return { error: 'mv id:<number> only available in task context. Use: mv task first' };
      }
      const id = target.split(':')[1];
      if (!id || isNaN(parseInt(id, 10))) {
        return { error: 'Invalid task ID format. Use: mv id:<number>' };
      }
    } else {
      // Validate target
      if (!['task', 'events', 'dt'].includes(target)) {
        return { error: `Invalid mv target: ${target}. Valid: task, events, dt, id:<number>, ..` };
      }
    }

    return {
      action: 'mv',
      target,
      flags
    };
  }

  static parseExit(args) {
    return {
      action: 'exit',
      flags: args
    };
  }

  static parseId(input, context, contextId) {
    // Check if we're in the task context
    if (context !== 'task') {
      return { error: 'id commands only available in task context. Use: mv task' };
    }

    // Parse id:<number> commands
    const parts = input.split(/\s+/);
    const idPart = parts[0];

    let taskId = null;
    let flagsStartIndex = 1;

    // Check if command starts with id:X or if we're already in id:X context
    if (idPart.startsWith('id:')) {
      const id = idPart.split(':')[1];
      taskId = parseInt(id, 10);
      if (isNaN(taskId)) {
        return { error: 'Invalid task ID' };
      }
      flagsStartIndex = 1;
    } else if (contextId) {
      // We're in id:X context, so use contextId and treat first part as flag
      taskId = contextId;
      flagsStartIndex = 0;
    } else {
      return { error: 'No task ID specified. Use: id:<number> or mv id:<number>' };
    }

    const flags = parts.slice(flagsStartIndex);

    // Handle -rm
    if (flags.includes('-rm')) {
      return {
        action: 'id',
        id: taskId,
        flags: ['-rm']
      };
    }

    // Handle -v
    if (flags.includes('-v')) {
      return {
        action: 'id',
        id: taskId,
        flags: ['-v']
      };
    }

    // Handle --link
    if (flags.includes('--link')) {
      const linkIndex = flags.indexOf('--link');
      const afterLink = flags.slice(linkIndex + 1);

      if (afterLink.length === 0) {
        // List links
        return {
          action: 'id',
          id: taskId,
          flags: ['--link'],
          linkAction: 'list'
        };
      } else if (afterLink[0] === '-a') {
        // Add link
        const link = afterLink.slice(1).join(' ');
        if (!link) {
          return { error: 'Link value required: --link -a "<url>"' };
        }
        return {
          action: 'id',
          id: taskId,
          flags: ['--link'],
          linkAction: 'add',
          linkValue: link.replace(/^["']|["']$/g, '')
        };
      } else if (afterLink[0] === '-rm') {
        // Remove link
        const linkId = afterLink[1];
        if (!linkId || isNaN(parseInt(linkId, 10))) {
          return { error: 'Link ID required: --link <linkId> -rm' };
        }
        return {
          action: 'id',
          id: taskId,
          flags: ['--link'],
          linkAction: 'remove',
          linkId: parseInt(linkId, 10)
        };
      } else {
        // Check specific link
        const linkId = afterLink[0];
        if (afterLink[1] === '-rm') {
          return {
            action: 'id',
            id: taskId,
            flags: ['--link'],
            linkAction: 'remove',
            linkId: parseInt(linkId, 10)
          };
        }
      }
    }

    // Handle --status
    if (flags.includes('--status')) {
      const statusIndex = flags.indexOf('--status');
      const afterStatus = flags.slice(statusIndex + 1);

      if (afterStatus.length === 0) {
        // Show status
        return {
          action: 'id',
          id: taskId,
          flags: ['--status'],
          statusAction: 'show'
        };
      }

      // Update status
      const statusFlag = afterStatus[0];
      const statusMap = {
        '-p': 'in_progress',
        '-c': 'completed',
        '-d': 'cancelled',
        '-a': 'pending'
      };

      if (statusFlag === '-ex') {
        // Moved status requires date
        const date = afterStatus[1];
        if (!date || !/^\d{2}\.\d{2}\.\d{4}$/.test(date)) {
          return { error: 'Date required for -ex flag: --status -ex DD.MM.YYYY' };
        }
        return {
          action: 'id',
          id: taskId,
          flags: ['--status'],
          statusAction: 'update',
          newStatus: 'moved',
          movedToDate: date
        };
      } else if (statusMap[statusFlag]) {
        return {
          action: 'id',
          id: taskId,
          flags: ['--status'],
          statusAction: 'update',
          newStatus: statusMap[statusFlag]
        };
      } else {
        return { error: `Invalid status flag: ${statusFlag}. Valid: -p, -c, -d, -a, -ex <date>` };
      }
    }

    return { error: 'Invalid command. Try: -rm, -v, --link, --status' };
  }

  static getShowOptions(context) {
    const options = [
      'board - admin panel statistics',
      'today - tasks for today',
      'today -a - awaiting tasks for today',
      'today -p - in progress tasks for today',
      'today -c - completed tasks for today',
      'today -d - cancelled tasks for today',
      'today -ex - postponed tasks for today',
      'today ++ - tasks for today and tomorrow',
      'today -- - tasks for yesterday and today',
      'DD.MM.YYYY - tasks for specific date',
      '++ - week view',
      'month - month view',
      'year - year view',
      'slot today - time-bound tasks for today',
      'slot DD.MM.YYYY - time-bound tasks for date',
      'dt - taskbases list',
      'events -c - current month events',
      'events -p - past events',
      'events -f - future events',
      'events -a - all events'
    ];

    return options;
  }
}
