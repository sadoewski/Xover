import { useState, useMemo } from 'react';
import { IconX, IconSearch } from '@tabler/icons-react';
import TablerIconRenderer from '../TablerIconRenderer';
import { iconCategories, getCategoryList, searchIcons } from './iconCategories';
import './IconPicker.css';

/**
 * IconPicker - Modal for selecting IconTabler icons
 *
 * @param {boolean} isOpen - Whether modal is open
 * @param {function} onClose - Callback to close modal
 * @param {function} onSelectIcon - Callback when icon is selected (receives iconName)
 * @param {string} currentIcon - Currently selected icon name
 * @param {string} previewColor - Color for icon preview (default: currentColor)
 */
export default function IconPicker({
  isOpen,
  onClose,
  onSelectIcon,
  currentIcon = 'folder',
  previewColor
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setIconSearchQuery] = useState('');
  const [hoveredIcon, setHoveredIcon] = useState(null);

  const categoryList = useMemo(() => getCategoryList(), []);

  // IconFilter icons based on search and category
  const displayedIcons = useMemo(() => {
    if (searchQuery) {
      return searchIcons(searchQuery);
    }
    return iconCategories[selectedCategory]?.icons || [];
  }, [selectedCategory, searchQuery]);

  const handleSelectIcon = (iconName) => {
    onSelectIcon(iconName);
    onClose();
  };

  const handleIconSearchChange = (e) => {
    setIconSearchQuery(e.target.value);
    // Switch to 'all' when searching
    if (e.target.value && selectedCategory !== 'all') {
      setSelectedCategory('all');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="icon-picker-overlay" onClick={onClose}>
      <div className="icon-picker-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="icon-picker-header">
          <h3>Выбрать иконку</h3>
          <button
            className="icon-picker-close"
            onClick={onClose}
            aria-label="Закрыть"
          >
            <IconX size={20} />
          </button>
        </div>

        {/* IconSearch */}
        <div className="icon-picker-search">
          <IconSearch size={18} style={{ color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Поиск иконки..."
            value={searchQuery}
            onChange={handleIconSearchChange}
            autoFocus
          />
        </div>

        {/* Categories */}
        <div className="icon-picker-categories">
          {categoryList.map(category => (
            <button
              key={category.key}
              className={selectedCategory === category.key ? 'active' : ''}
              onClick={() => {
                setSelectedCategory(category.key);
                setIconSearchQuery('');
              }}
            >
              {category.label} ({category.count})
            </button>
          ))}
        </div>

        {/* Icon Grid */}
        <div className="icon-picker-grid">
          {displayedIcons.length > 0 ? (
            displayedIcons.map(iconName => (
              <button
                key={iconName}
                className={`icon-picker-item ${currentIcon === iconName ? 'selected' : ''}`}
                onClick={() => handleSelectIcon(iconName)}
                onMouseEnter={() => setHoveredIcon(iconName)}
                onMouseLeave={() => setHoveredIcon(null)}
                title={iconName}
              >
                <TablerIconRenderer
                  iconName={iconName}
                  size={24}
                  color={currentIcon === iconName ? undefined : previewColor}
                />
              </button>
            ))
          ) : (
            <div className="icon-picker-empty">
              <IconSearch size={40} />
              <p>Иконки не найдены</p>
              <p style={{ fontSize: '12px' }}>Попробуйте другой поисковый запрос</p>
            </div>
          )}
        </div>

        {/* Footer with preview */}
        <div className="icon-picker-footer">
          <div className="icon-picker-preview">
            <TablerIconRenderer
              iconName={hoveredIcon || currentIcon}
              size={32}
              color={previewColor}
            />
            <span className="icon-picker-preview-name">
              {hoveredIcon || currentIcon}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
