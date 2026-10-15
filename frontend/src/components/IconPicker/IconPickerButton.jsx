import { useState } from 'react';
import { IconEdit } from '@tabler/icons-react';
import TablerIconRenderer from '../TablerIconRenderer';
import IconPicker from './IconPicker';

/**
 * IconPickerButton - Button that triggers icon picker modal
 *
 * @param {string} currentIcon - Currently selected icon name
 * @param {string} groupColor - Color to display icon with
 * @param {function} onSelectIcon - Callback when icon is selected
 * @param {number} size - Icon size (default: 24)
 * @param {boolean} compact - If true, shows only small edit button (default: false)
 */
export default function IconPickerButton({
  currentIcon = 'folder',
  groupColor,
  onSelectIcon,
  size = 24,
  compact = false
}) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Compact version - small circular edit button
  if (compact) {
    return (
      <>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsPickerOpen(true);
          }}
          style={{
            width: '20px',
            height: '20px',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            borderRadius: '50%',
            cursor: 'pointer',
            transition: 'all 0.15s',
            color: 'var(--text-secondary)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--accent-primary)';
            e.currentTarget.style.borderColor = 'var(--accent-primary)';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg-secondary)';
            e.currentTarget.style.borderColor = 'var(--border-primary)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <IconEdit size={12} />
        </button>

        <IconPicker
          isOpen={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          onSelectIcon={onSelectIcon}
          currentIcon={currentIcon}
          previewColor={groupColor}
        />
      </>
    );
  }

  // Full version - with icon and text
  return (
    <>
      <button
        type="button"
        onClick={() => setIsPickerOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 16px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)',
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'all 0.15s',
          fontSize: '14px',
          color: 'var(--text-primary)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--bg-hover)';
          e.currentTarget.style.borderColor = 'var(--accent-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--bg-secondary)';
          e.currentTarget.style.borderColor = 'var(--border-primary)';
        }}
      >
        <TablerIconRenderer
          iconName={currentIcon}
          size={size}
          color={groupColor}
        />
        <span>Выбрать иконку</span>
      </button>

      <IconPicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelectIcon={onSelectIcon}
        currentIcon={currentIcon}
        previewColor={groupColor}
      />
    </>
  );
}
