import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import { terminalService, authService } from '../services/api';
import { CommandParser } from '../utils/terminalParser';
import { TerminalFormatter } from '../utils/terminalFormatter';
import './XoverTerminal.css';

const XoverTerminal = () => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  // Terminal state
  const [context, setContext] = useState('root'); // root, task, events, dt
  const [contextId, setContextId] = useState(null); // for task>id:X context
  const [commandHistory, setCommandHistory] = useState([]);

  // Use refs for values that need to be accessed in event handlers
  const currentInputRef = useRef('');
  const cursorPositionRef = useRef(0);
  const historyIndexRef = useRef(-1);
  const commandHistoryRef = useRef([]);
  const contextRef = useRef('root');
  const contextIdRef = useRef(null);

  // Sync refs with state
  useEffect(() => {
    commandHistoryRef.current = commandHistory;
  }, [commandHistory]);

  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  useEffect(() => {
    contextIdRef.current = contextId;
  }, [contextId]);

  const getUsername = () => {
    const user = authService.getCurrentUser();
    return user?.username || 'user';
  };

  const getPrompt = () => {
    const username = getUsername();
    const currentContext = contextRef.current;
    const currentContextId = contextIdRef.current;

    if (currentContext === 'root') {
      return `xover@${username}`;
    } else if (currentContext === 'task' && currentContextId) {
      return `xover@${username}>task>id:${currentContextId}`;
    } else {
      return `xover@${username}>${currentContext}`;
    }
  };

  const writePrompt = () => {
    if (xtermRef.current) {
      xtermRef.current.write(`\r\n${getPrompt()}: `);
    }
  };

  const writeLine = (text, color = null) => {
    if (xtermRef.current) {
      if (color) {
        xtermRef.current.write(`\x1b[${color}m${text}\x1b[0m\r\n`);
      } else {
        xtermRef.current.write(`${text}\r\n`);
      }
    }
  };

  const clearInput = () => {
    if (xtermRef.current) {
      const prompt = getPrompt();
      const inputLength = currentInputRef.current.length;
      // Clear the entire line
      xtermRef.current.write('\r\x1b[K');
      // Write prompt
      xtermRef.current.write(`${prompt}: `);
    }
  };

  const redrawInput = (input) => {
    if (xtermRef.current) {
      const prompt = getPrompt();
      // Clear line and redraw
      xtermRef.current.write('\r\x1b[K');
      xtermRef.current.write(`${prompt}: ${input}`);
      // Move cursor to the saved position
      const charsFromEnd = input.length - cursorPositionRef.current;
      if (charsFromEnd > 0) {
        xtermRef.current.write(`\x1b[${charsFromEnd}D`);
      }
    }
  };

  const handleAutocomplete = (baseCommand) => {
    const parts = baseCommand.split(' ');
    const mainCommand = parts[0];

    if (mainCommand === 'show') {
      // Show available options for 'show' command
      const options = getShowOptions();
      if (options.length > 0) {
        writeLine('Available options:');
        options.forEach(opt => writeLine(`  ${opt}`));
      } else {
        writeLine('No options available');
      }
    } else if (mainCommand === 'mv') {
      writeLine('Available contexts:');
      writeLine('  task   - Move to task context');
      writeLine('  events - Move to events context');
      writeLine('  dt     - Move to datatask context');
      writeLine('  ..     - Go back one level');
      writeLine('  root   - Return to root context');
    } else if (mainCommand === 'id' || parts[0].startsWith('id:')) {
      writeLine('Available flags:');
      writeLine('  -rm        - Remove task');
      writeLine('  -v         - View task details');
      writeLine('  --link     - Manage task links');
      writeLine('  --status   - Manage task status');
    } else if (mainCommand === 'help') {
      writeLine('Available flags:');
      writeLine('  --now - Show commands for current context');
    } else {
      writeLine('Available commands:');
      writeLine('  help   - Show all commands');
      writeLine('  show   - Display information');
      writeLine('  mv     - Move to context');
      writeLine('  exit   - Go back');
      writeLine('  id:X   - Work with task by ID');
    }
  };

  const getShowOptions = () => {
    const ctx = contextRef.current;
    if (ctx === 'root') {
      return [
        'board             - Show dashboard statistics',
        'today             - Tasks for today',
        'DD.MM.YYYY        - Tasks for specific date',
        '++                - Tasks for this week',
        'month             - Tasks for this month',
        'year              - Tasks for this year',
        'slot today        - Time-bound tasks for today',
      ];
    } else if (ctx === 'task') {
      return [
        'id:X -v           - View task details',
        'id:X -rm          - Remove task',
        'id:X --link       - Manage links',
        'id:X --status     - Manage status',
      ];
    } else if (ctx === 'events') {
      return [
        'events -c         - Current events',
        'events -p         - Past events',
        'events -f         - Future events',
        'events -a         - All events',
      ];
    } else if (ctx === 'dt') {
      return [
        'dt                - Show all datatasks',
      ];
    }
    return [];
  };

  const executeCommand = async (command) => {
    const trimmed = command.trim();
    if (!trimmed) {
      writePrompt();
      return;
    }

    // Add to history
    setCommandHistory(prev => [...prev, trimmed]);
    historyIndexRef.current = -1;

    // Check for autocomplete request (command ends with ?)
    if (trimmed.endsWith('?')) {
      const baseCommand = trimmed.slice(0, -1).trim();
      handleAutocomplete(baseCommand);
      writePrompt();
      return;
    }

    try {
      // Parse command
      const parsed = CommandParser.parse(trimmed, contextRef.current, contextIdRef.current);

      if (parsed.error) {
        writeLine(parsed.error, '31'); // Red color
        writePrompt();
        return;
      }

      // Handle context changes
      if (parsed.action === 'mv') {
        if (parsed.target === '..') {
          // Go back
          if (contextIdRef.current) {
            setContextId(null);
            contextIdRef.current = null;
          } else if (contextRef.current !== 'root') {
            setContext('root');
            contextRef.current = 'root';
          }
          writePrompt();
          return;
        } else if (parsed.target === 'root' || parsed.flags.includes('-a')) {
          // Go to root
          setContext('root');
          setContextId(null);
          contextRef.current = 'root';
          contextIdRef.current = null;
          writePrompt();
          return;
        } else {
          // Move to new context
          if (['task', 'events', 'dt'].includes(parsed.target)) {
            setContext(parsed.target);
            setContextId(null);
            contextRef.current = parsed.target;
            contextIdRef.current = null;
            writePrompt();
            return;
          } else if (parsed.target.startsWith('id:')) {
            const id = parsed.target.split(':')[1];
            setContextId(parseInt(id, 10));
            contextIdRef.current = parseInt(id, 10);
            writePrompt();
            return;
          }
        }
      }

      if (parsed.action === 'exit') {
        if (parsed.flags.includes('-a')) {
          setContext('root');
          setContextId(null);
          contextRef.current = 'root';
          contextIdRef.current = null;
        } else if (contextIdRef.current) {
          setContextId(null);
          contextIdRef.current = null;
        } else if (contextRef.current !== 'root') {
          setContext('root');
          contextRef.current = 'root';
        }
        writePrompt();
        return;
      }

      // Execute command
      const result = await executeTerminalCommand(parsed);

      if (result.output) {
        writeLine(result.output);
      }

      if (result.error) {
        writeLine(result.error, '31');
      }

    } catch (error) {
      writeLine(`Error: ${error.message}`, '31');
    }

    writePrompt();
  };

  const executeTerminalCommand = async (parsed) => {
    switch (parsed.action) {
      case 'help':
        return handleHelp(parsed);
      case 'show':
        return handleShow(parsed);
      case 'id':
        return handleIdCommand(parsed);
      default:
        return { error: 'Unknown command' };
    }
  };

  const handleHelp = (parsed) => {
    const allCommands = [
      'help - show all commands',
      'help --now - show available commands for current context',
      'show - display various information',
      'mv <target> - move to context (task, events, dt)',
      'exit - go back one level',
      'exit -a - return to root',
      '<command> ? - show command options'
    ];

    const contextCommands = {
      root: ['show board', 'show today', 'show <date>', 'show ++', 'show month', 'show year', 'mv task', 'mv events', 'mv dt'],
      task: ['id:<id> -rm', 'id:<id> -v', 'id:<id> --link', 'id:<id> --status', 'mv id:<id>', 'exit'],
      events: ['show events -c', 'show events -p', 'show events -f', 'show events -a', 'exit'],
      dt: ['show dt', 'exit']
    };

    if (parsed.flags.includes('--now')) {
      const available = contextCommands[context] || [];
      return { output: `Available commands:\n${available.join('\n')}` };
    }

    return { output: `All commands:\n${allCommands.join('\n')}` };
  };

  const handleShow = async (parsed) => {
    try {
      // Check for autocomplete
      if (parsed.autocomplete) {
        const options = CommandParser.getShowOptions(context);
        return { output: options.join('\n') };
      }

      const { target, flags } = parsed;

      if (target === 'board') {
        const data = await terminalService.getBoard();
        return { output: TerminalFormatter.formatBoard(data.stats) };
      }

      if (target === 'today' || /^\d{2}\.\d{2}\.\d{4}$/.test(target)) {
        const date = target === 'today' ? getTodayDate() : target;
        const status = flags.length > 0 ? getStatusFromFlag(flags[0]) : null;
        const data = await terminalService.getTasksByDate(date, status);

        if (data.tasks.length === 0) {
          return { output: 'No tasks for today' };
        }

        if (flags.includes('-v')) {
          return { output: TerminalFormatter.formatTasksVerbose(data.tasks) };
        }

        return { output: TerminalFormatter.formatTasksList(data.tasks) };
      }

      if (target === '++' || target === 'month' || target === 'year') {
        const { startDate, endDate } = getDateRange(target);
        const status = flags.length > 0 ? getStatusFromFlag(flags[0]) : null;
        const data = await terminalService.getTasksInRange(startDate, endDate, status);
        return { output: TerminalFormatter.formatTasksGrouped(data.tasks) };
      }

      if (target === 'dt') {
        const data = await terminalService.getDatatasks();
        return { output: TerminalFormatter.formatDatatasks(data.datatasks) };
      }

      if (target === 'events') {
        const filter = flags.includes('-c') ? 'current' :
                      flags.includes('-p') ? 'past' :
                      flags.includes('-f') ? 'future' : 'all';
        const data = await terminalService.getEvents(filter);
        return { output: TerminalFormatter.formatEvents(data.events) };
      }

      if (target === 'slot') {
        const date = flags[0] === 'today' ? getTodayDate() : flags[0];
        const data = await terminalService.getTasksByDate(date);
        const timeBound = data.tasks.filter(t => t.is_time_bound);
        return { output: TerminalFormatter.formatTasksList(timeBound) };
      }

      return { error: 'Invalid show command' };
    } catch (error) {
      return { error: error.message || 'Failed to fetch data' };
    }
  };

  const handleIdCommand = async (parsed) => {
    try {
      const taskId = parsed.id || contextId;

      if (!taskId) {
        return { error: 'No task ID specified' };
      }

      if (parsed.flags.includes('-rm')) {
        const result = await terminalService.deleteTask(taskId);
        return { output: result.message };
      }

      if (parsed.flags.includes('-v')) {
        const data = await terminalService.getTaskDetails(taskId);
        return { output: TerminalFormatter.formatTaskDetails(data.task) };
      }

      if (parsed.flags.includes('--link')) {
        if (parsed.linkAction === 'list') {
          const data = await terminalService.getTaskLinks(taskId);
          return { output: TerminalFormatter.formatLinks(data.links) };
        } else if (parsed.linkAction === 'add') {
          const result = await terminalService.addTaskLink(taskId, parsed.linkValue);
          return { output: result.message };
        } else if (parsed.linkAction === 'remove') {
          const result = await terminalService.deleteTaskLink(taskId, parsed.linkId);
          return { output: result.message };
        }
      }

      if (parsed.flags.includes('--status')) {
        if (parsed.statusAction === 'show') {
          const data = await terminalService.getTaskDetails(taskId);
          const statusLabel = getStatusLabel(data.task.status);
          return { output: `Task #${taskId} status: ${statusLabel}` };
        } else if (parsed.statusAction === 'update') {
          const result = await terminalService.updateTaskStatus(
            taskId,
            parsed.newStatus,
            parsed.movedToDate
          );
          return { output: result.message };
        }
      }

      return { error: 'Invalid command for task' };
    } catch (error) {
      return { error: error.message || 'Failed to execute command' };
    }
  };

  // Helper functions
  const getTodayDate = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const getDateRange = (target) => {
    const now = new Date();
    let startDate, endDate;

    if (target === '++') {
      // Week view
      const dayOfWeek = now.getDay();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - dayOfWeek);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      startDate = formatDateForAPI(startOfWeek);
      endDate = formatDateForAPI(endOfWeek);
    } else if (target === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      startDate = formatDateForAPI(startOfMonth);
      endDate = formatDateForAPI(endOfMonth);
    } else if (target === 'year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31);

      startDate = formatDateForAPI(startOfYear);
      endDate = formatDateForAPI(endOfYear);
    }

    return { startDate, endDate };
  };

  const formatDateForAPI = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const getStatusFromFlag = (flag) => {
    const statusMap = {
      '-a': 'pending',
      '-p': 'in_progress',
      '-c': 'completed',
      '-d': 'cancelled',
      '-ex': 'moved'
    };
    return statusMap[flag] || null;
  };

  const getStatusLabel = (status) => {
    const labels = {
      'pending': 'awaiting',
      'in_progress': 'in progress',
      'completed': 'completed',
      'cancelled': 'cancelled',
      'moved': 'postponed'
    };
    return labels[status] || status;
  };

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: '"Cascadia Code", Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#000000',
        foreground: '#ffffff',
        cursor: '#ffffff',
        cursorAccent: '#000000',
        selection: '#ffffff40'
      },
      scrollback: 1000,
      convertEol: true
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Welcome message
    term.write('Xover Terminal v1.0\r\n');
    term.write('Type "help" for available commands\r\n');
    term.write(`\r\n${getPrompt()}: `);

    setIsReady(true);

    // Handle resize
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);

    // Handle input
    term.onData(data => {
      const term = xtermRef.current;
      if (!term) return;

      const code = data.charCodeAt(0);

      // Enter key
      if (code === 13) {
        term.write('\r\n');
        executeCommand(currentInputRef.current);
        currentInputRef.current = '';
        cursorPositionRef.current = 0;
        return;
      }

      // Backspace
      if (code === 127) {
        if (cursorPositionRef.current > 0) {
          const newInput = currentInputRef.current.slice(0, cursorPositionRef.current - 1) +
                          currentInputRef.current.slice(cursorPositionRef.current);
          currentInputRef.current = newInput;
          cursorPositionRef.current = cursorPositionRef.current - 1;
          redrawInput(newInput);
        }
        return;
      }

      // Arrow up
      if (data === '\x1b[A') {
        if (commandHistoryRef.current.length > 0) {
          const newIndex = historyIndexRef.current === -1
            ? commandHistoryRef.current.length - 1
            : Math.max(0, historyIndexRef.current - 1);
          historyIndexRef.current = newIndex;
          const historicalCommand = commandHistoryRef.current[newIndex];
          currentInputRef.current = historicalCommand;
          cursorPositionRef.current = historicalCommand.length;
          clearInput();
          redrawInput(historicalCommand);
        }
        return;
      }

      // Arrow down
      if (data === '\x1b[B') {
        if (historyIndexRef.current !== -1) {
          const newIndex = historyIndexRef.current + 1;
          if (newIndex >= commandHistoryRef.current.length) {
            historyIndexRef.current = -1;
            currentInputRef.current = '';
            cursorPositionRef.current = 0;
            clearInput();
          } else {
            historyIndexRef.current = newIndex;
            const historicalCommand = commandHistoryRef.current[newIndex];
            currentInputRef.current = historicalCommand;
            cursorPositionRef.current = historicalCommand.length;
            clearInput();
            redrawInput(historicalCommand);
          }
        }
        return;
      }

      // Arrow left
      if (data === '\x1b[D') {
        if (cursorPositionRef.current > 0) {
          cursorPositionRef.current--;
          term.write('\x1b[D');
        }
        return;
      }

      // Arrow right
      if (data === '\x1b[C') {
        if (cursorPositionRef.current < currentInputRef.current.length) {
          cursorPositionRef.current++;
          term.write('\x1b[C');
        }
        return;
      }

      // Regular character
      if (code >= 32 && code < 127) {
        const newInput = currentInputRef.current.slice(0, cursorPositionRef.current) +
                        data +
                        currentInputRef.current.slice(cursorPositionRef.current);
        currentInputRef.current = newInput;
        cursorPositionRef.current = cursorPositionRef.current + 1;
        term.write(data);
      }
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, []);

  return (
    <div className="xover-terminal-container">
      <div ref={terminalRef} className="xover-terminal" />
    </div>
  );
};

export default XoverTerminal;
