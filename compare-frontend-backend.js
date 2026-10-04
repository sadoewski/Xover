// Схемы данных которые отправляет фронтенд (из services/api.js)
const frontendSends = {
  'tasksService.createTask': {
    title: 'string',
    description: 'string | null',
    groupId: 'number',
    groupTypeId: 'number | null',
    priorityId: 'number',
    date: 'string (yyyy-MM-dd)',
    isTimeBound: 'boolean',
    timeSlotStart: 'string | null',
    timeSlotEnd: 'string | null',
    taskRelations: 'number[] | undefined',
  },
  
  'tasksService.updateTask': {
    // Любые поля из allowedFields в контроллере
    title: 'string?',
    description: 'string?',
    status: 'string?',
    statusReason: 'string?',
    timeSlotStart: 'string?',
    timeSlotEnd: 'string?',
    isTimeBound: 'boolean?',
    isFreeTime: 'boolean?',
    checklist: 'array?',
    priorityId: 'number?',
    linkedTasks: 'array?',
    links: 'array?',
    logs: 'array?',
    date: 'string?',
    movedToDate: 'string?',
    movedFromDate: 'string?',
  },
  
  'eventsService.createEvent': {
    type: 'string',
    name: 'string',
    description: 'string',
    month: 'number',
    day: 'number',
    date: 'string',
    isDayOff: 'boolean',
    isYearly: 'boolean',
  },
  
  'eventsService.updateEvent': {
    type: 'string?',
    name: 'string?',
    description: 'string?',
    month: 'number?',
    day: 'number?',
    date: 'string?',
    isDayOff: 'boolean?',
    isYearly: 'boolean?',
  },
  
  'groupsService.createGroup': {
    name: 'string',
    color: 'string',
    description: 'string',
  },
  
  'prioritiesService.createPriority': {
    name: 'string',
    color: 'string',
    description: 'string',
    level: 'number',
  },
  
  'dataTasksService.create': {
    name: 'string',
    groupId: 'number',
    timeSlotStart: 'string',
    timeSlotEnd: 'string',
    isTimeBound: 'boolean',
    dates: 'string[]',
  },
};

// Схемы которые ожидает бэкенд (после middleware преобразования)
const backendExpects = {
  'tasksController.createTask': {
    title: 'string',
    description: 'string | null',
    group_id: 'number',
    group_type_id: 'number | null',
    priority_id: 'number',
    date: 'string',
    is_time_bound: 'boolean',
    time_slot_start: 'string | null',
    time_slot_end: 'string | null',
    task_relations: 'number[] | undefined',
  },
  
  'tasksController.updateTask': {
    title: 'string?',
    description: 'string?',
    status: 'string?',
    status_reason: 'string?',
    time_slot_start: 'string?',
    time_slot_end: 'string?',
    is_time_bound: 'boolean?',
    is_free_time: 'boolean?',
    checklist: 'array?',
    priority_id: 'number?',
    linked_tasks: 'array?',
    links: 'array?',
    logs: 'array?',
    date: 'string?',
    moved_to_date: 'string?',
    moved_from_date: 'string?',
  },
  
  'eventsController.createEvent': {
    type: 'string',
    name: 'string',
    description: 'string',
    month: 'number',
    day: 'number',
    date: 'string',
    is_day_off: 'boolean',
    is_yearly: 'boolean',
  },
  
  'eventsController.updateEvent': {
    type: 'string?',
    name: 'string?',
    description: 'string?',
    month: 'number?',
    day: 'number?',
    date: 'string?',
    is_day_off: 'boolean?',
    is_yearly: 'boolean?',
  },
  
  'groupsController.createGroup': {
    name: 'string',
    color: 'string',
    description: 'string',
  },
  
  'prioritiesController.createPriority': {
    name: 'string',
    color: 'string',
    description: 'string',
    level: 'number',
  },
  
  'datatasksController.createDatatask': {
    name: 'string',
    group_id: 'number',
    time_slot_start: 'string',
    time_slot_end: 'string',
    is_time_bound: 'boolean',
    dates: 'string[]',
  },
};

console.log('🔍 ПРОБЛЕМА: Фронтенд отправляет camelCase, бэкенд ожидает snake_case\n');
console.log('❌ БЕЗ MIDDLEWARE конвертации данные НЕ СОВПАДАЮТ!\n');
console.log('Примеры несоответствий:');
console.log('  Frontend → Backend');
console.log('  groupId → group_id');
console.log('  timeSlotStart → time_slot_start');
console.log('  isDayOff → is_day_off');
console.log('  isTimeBound → is_time_bound');
console.log('  priorityId → priority_id');
console.log('\n⚠️  НУЖНО: Добавить middleware для конвертации camelCase ↔ snake_case');
console.log('    ИЛИ: Изменить все контроллеры чтобы принимали camelCase\n');
