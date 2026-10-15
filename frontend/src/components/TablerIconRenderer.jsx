import * as IconTablerIcons from '@tabler/icons-react';

/**
 * TablerIconRenderer - Dynamically renders Tabler icons by name
 *
 * @param {string} iconName - Kebab-case icon name (e.g., 'folder-open', 'calendar-event')
 * @param {number} size - Icon size in pixels (default: 20)
 * @param {string} color - Icon color (default: currentColor)
 * @param {string} className - Additional CSS classes
 * @param {number} stroke - Stroke width (default: 1.5)
 */
export default function TablerIconRenderer({
  iconName = 'question-mark',
  size = 20,
  color,
  className = '',
  stroke = 1.5
}) {
  // Convert kebab-case to PascalCase with Icon prefix
  // 'folder-open' -> 'IconFolderOpen'
  const getIconComponent = (name) => {
    const pascalName = 'Icon' + name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');

    return IconTablerIcons[pascalName] || IconTablerIcons.IconQuestionMark;
  };

  const IconComponent = getIconComponent(iconName);

  return (
    <IconComponent
      size={size}
      color={color}
      className={className}
      stroke={stroke}
    />
  );
}
