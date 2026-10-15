/**
 * iconCategories.js - Curated list of Tabler icons organized by category
 * Icons are stored as kebab-case strings
 */

export const iconCategories = {
  all: {
    label: 'Все',
    icons: [] // Populated dynamically from all categories
  },
  general: {
    label: 'Общие',
    icons: [
      'folder', 'folder-open', 'file', 'file-text', 'files', 'clipboard',
      'check', 'x', 'plus', 'minus', 'trash', 'edit', 'pencil',
      'star', 'star-filled', 'heart', 'heart-filled', 'bookmark',
      'flag', 'tag', 'tags', 'search', 'settings', 'adjustments',
      'filter', 'sort-ascending', 'sort-descending', 'refresh',
      'lock', 'lock-open', 'eye', 'eye-off', 'shield', 'key',
      'bell', 'notification', 'alert-circle', 'info-circle',
      'help', 'question-mark', 'circle-check', 'circle-x'
    ]
  },
  business: {
    label: 'Бизнес',
    icons: [
      'briefcase', 'building', 'building-store', 'calendar', 'calendar-event',
      'clock', 'clock-hour-4', 'target', 'trophy', 'chart-bar',
      'chart-line', 'chart-pie', 'trending-up', 'trending-down',
      'currency-dollar', 'currency-euro', 'currency-bitcoin',
      'wallet', 'receipt', 'credit-card', 'coins',
      'presentation', 'report', 'calculator', 'scale',
      'user', 'users', 'user-circle', 'id', 'address-book',
      'mail', 'phone', 'inbox', 'send'
    ]
  },
  development: {
    label: 'Разработка',
    icons: [
      'code', 'terminal', 'command', 'git-branch', 'git-commit',
      'bug', 'database', 'server', 'cloud', 'api',
      'device-desktop', 'device-mobile', 'device-tablet', 'devices',
      'browser', 'window', 'box', 'package', 'packages',
      'puzzle', 'cpu', 'plug', 'brand-github', 'brand-gitlab'
    ]
  },
  creative: {
    label: 'Творчество',
    icons: [
      'palette', 'brush', 'pencil', 'paint', 'color-picker',
      'camera', 'photo', 'image', 'video', 'music',
      'microphone', 'movie', 'art', 'marquee',
      'diamond', 'sparkles', 'wand', 'magic-stick'
    ]
  },
  communication: {
    label: 'Коммуникация',
    icons: [
      'message', 'message-circle', 'messages', 'send',
      'inbox', 'mail-opened', 'at', 'share',
      'link', 'unlink', 'phone-call', 'phone-incoming',
      'phone-outgoing', 'video', 'microphone', 'speakerphone',
      'megaphone', 'rss', 'world', 'antenna'
    ]
  },
  navigation: {
    label: 'Навигация',
    icons: [
      'arrow-left', 'arrow-right', 'arrow-up', 'arrow-down',
      'arrow-narrow-left', 'arrow-narrow-right', 'arrow-back',
      'chevron-left', 'chevron-right', 'chevron-up', 'chevron-down',
      'chevrons-left', 'chevrons-right', 'chevrons-up', 'chevrons-down',
      'menu', 'menu-2', 'dots', 'dots-vertical',
      'home', 'dashboard', 'layout', 'layout-grid',
      'list', 'list-details', 'maximize', 'minimize',
      'arrows-maximize', 'arrows-minimize', 'expand', 'shrink'
    ]
  },
  education: {
    label: 'Образование',
    icons: [
      'book', 'book-2', 'books', 'notebook',
      'school', 'pencil', 'ballpen', 'certificate',
      'award', 'trophy', 'medal', 'rosette',
      'bulb', 'brain', 'atom', 'flask',
      'microscope', 'telescope', 'test-pipe', 'math'
    ]
  },
  media: {
    label: 'Медиа',
    icons: [
      'play', 'pause', 'stop', 'skip-forward',
      'skip-back', 'rewind', 'fast-forward', 'volume',
      'volume-2', 'volume-3', 'volume-off', 'music',
      'headphones', 'disc', 'cassette', 'vinyl'
    ]
  },
  sports: {
    label: 'Спорт',
    icons: [
      'run', 'walk', 'bike', 'swimming',
      'ball-football', 'ball-basketball', 'ball-tennis', 'ball-volleyball',
      'barbell', 'dumbbell', 'gymnastics', 'yoga',
      'target-arrow', 'medal', 'trophy', 'podium'
    ]
  },
  food: {
    label: 'Еда',
    icons: [
      'coffee', 'cup', 'glass', 'bottle',
      'pizza', 'apple', 'lemon', 'carrot',
      'egg', 'meat', 'fish', 'ice-cream',
      'cake', 'cookie', 'chef-hat', 'tools-kitchen'
    ]
  },
  transportation: {
    label: 'Транспорт',
    icons: [
      'car', 'bus', 'bike', 'scooter',
      'truck', 'tir', 'train', 'plane',
      'helicopter', 'rocket', 'ship', 'sailboat',
      'map-pin', 'map', 'route', 'compass'
    ]
  },
  weather: {
    label: 'Погода',
    icons: [
      'sun', 'moon', 'cloud', 'cloud-rain',
      'cloud-snow', 'cloud-storm', 'wind', 'temperature',
      'droplet', 'umbrella', 'snowflake', 'rainbow'
    ]
  }
};

// Populate 'all' category with all icons
iconCategories.all.icons = Object.keys(iconCategories)
  .filter(key => key !== 'all')
  .flatMap(key => iconCategories[key].icons);

/**
 * Get category list for tabs
 */
export const getCategoryList = () => {
  return Object.keys(iconCategories).map(key => ({
    key,
    label: iconCategories[key].label,
    count: iconCategories[key].icons.length
  }));
};

/**
 * Search icons across all categories
 */
export const searchIcons = (query) => {
  if (!query) return iconCategories.all.icons;

  const lowerQuery = query.toLowerCase();
  return iconCategories.all.icons.filter(icon =>
    icon.toLowerCase().includes(lowerQuery)
  );
};
