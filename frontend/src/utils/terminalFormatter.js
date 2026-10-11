export class TerminalFormatter {
  static formatBoard(stats) {
    return `
╔═══════════════════════════════════════╗
║         ADMIN PANEL - TODAY           ║
╠═══════════════════════════════════════╣
║ Total tasks:      ${String(stats.total).padStart(4)}              ║
║ Awaiting:         ${String(stats.pending).padStart(4)}              ║
║ In Progress:      ${String(stats.in_progress).padStart(4)}              ║
║ Completed:        ${String(stats.completed).padStart(4)}              ║
║ Cancelled:        ${String(stats.cancelled).padStart(4)}              ║
╚═══════════════════════════════════════╝
    `.trim();
  }

  static formatTasksList(tasks) {
    if (tasks.length === 0) {
      return 'Shell has nothing to display';
    }

    const lines = [];
    tasks.forEach(task => {
      const status = this.getStatusLabel(task.status);
      const time = task.is_time_bound
        ? ` [${task.time_slot_start?.slice(0,5)} - ${task.time_slot_end?.slice(0,5)}]`
        : '';
      lines.push(`#${task.id} - ${task.title}${time} - ${status}`);
    });

    return lines.join('\n');
  }

  static formatTasksVerbose(tasks) {
    if (tasks.length === 0) {
      return 'No tasks found';
    }

    const cards = tasks.map(task => {
      const links = task.links && task.links.length > 0
        ? `\nLinks: ${task.links.length} link(s)`
        : '';

      return `
┌──────────────────────────────────────┐
│ Task #${task.id}
├──────────────────────────────────────┤
│ Name: ${task.title}
│ Group: ${task.group_name || 'N/A'}
│ Tag: ${task.group_type_name || 'N/A'}
│ Status: ${this.getStatusLabel(task.status)}
│ Priority: ${task.priority_name || 'N/A'}
│ Created: ${new Date(task.created_at).toLocaleDateString()}${links}
└──────────────────────────────────────┘
      `.trim();
    });

    return cards.join('\n\n');
  }

  static formatTaskDetails(task) {
    const description = task.description ? `\nDescription: ${task.description}` : '';
    const time = task.is_time_bound
      ? `\nTime: ${task.time_slot_start?.slice(0,5)} - ${task.time_slot_end?.slice(0,5)}`
      : '';
    const links = task.links && task.links.length > 0
      ? `\nLinks: ${task.links.length} link(s)`
      : '';

    return `
┌──────────────────────────────────────┐
│ TASK #${task.id} DETAILS
├──────────────────────────────────────┤
│ Name: ${task.title}
│ Group: ${task.group_name || 'N/A'}
│ Tag: ${task.group_type_name || 'N/A'}
│ Priority: ${task.priority_name || 'N/A'}
│ Status: ${this.getStatusLabel(task.status)}
│ Date: ${new Date(task.date).toLocaleDateString()}${time}${description}${links}
│ Created: ${new Date(task.created_at).toLocaleDateString()}
└──────────────────────────────────────┘
    `.trim();
  }

  static formatTasksGrouped(tasksGrouped) {
    if (Object.keys(tasksGrouped).length === 0) {
      return 'Shell has nothing to display';
    }

    const lines = [];
    Object.entries(tasksGrouped).forEach(([date, tasks]) => {
      lines.push(`\n=== ${date} ===`);
      tasks.forEach(task => {
        const status = this.getStatusLabel(task.status);
        const desc = task.description ? ` - ${task.description.slice(0, 40)}` : '';
        lines.push(`  #${task.id}: ${task.title}${desc} (${status})`);
      });
    });

    return lines.join('\n');
  }

  static formatLinks(links) {
    if (links.length === 0) {
      return 'No links found';
    }

    const lines = ['Links:'];
    links.forEach(link => {
      const date = new Date(link.created_at).toLocaleDateString();
      lines.push(`  [${link.id}] ${link.url} - Created: ${date}`);
    });

    return lines.join('\n');
  }

  static formatDatatasks(datatasks) {
    if (datatasks.length === 0) {
      return 'No datatasks found';
    }

    const lines = ['DataTasks:'];
    datatasks.forEach(dt => {
      lines.push(`  ${dt.name} - ${dt.task_count || 0} task(s)`);
    });

    return lines.join('\n');
  }

  static formatEvents(events) {
    if (events.length === 0) {
      return 'No events found';
    }

    const lines = ['Events:'];
    events.forEach(event => {
      const date = event.day && event.month
        ? `${String(event.day).padStart(2, '0')}.${String(event.month).padStart(2, '0')}`
        : event.date
          ? new Date(event.date).toLocaleDateString()
          : 'No date';
      lines.push(`  ${event.name} - ${date}`);
    });

    return lines.join('\n');
  }

  static getStatusLabel(status) {
    const labels = {
      'pending': 'awaiting',
      'in_progress': 'in progress',
      'completed': 'completed',
      'cancelled': 'cancelled',
      'moved': 'postponed'
    };
    return labels[status] || status;
  }
}
