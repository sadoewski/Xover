import { useState } from 'react';
import { Folder, Table, FileText, StickyNote, Trash2, GripVertical } from 'lucide-react';
import './SiteWidget.css';

function SiteWidget({ item, editMode, onUpdate, onDelete, onOpenFolder }) {
  const [isEditing, setIsEditing] = useState(false);

  const getIcon = () => {
    switch (item.type) {
      case 'folder':
        return <Folder size={24} />;
      case 'database':
        return <Table size={24} />;
      case 'document':
        return <FileText size={24} />;
      case 'textboard':
        return <StickyNote size={24} />;
      default:
        return <FileText size={24} />;
    }
  };

  const getTypeLabel = () => {
    const labels = {
      folder: 'Папка',
      database: 'База данных',
      document: 'Документ',
      textboard: 'Текстовая доска'
    };
    return labels[item.type] || item.type;
  };

  const handleClick = () => {
    if (item.type === 'folder' && !editMode) {
      onOpenFolder();
    } else if (item.type === 'textboard' && !editMode) {
      setIsEditing(true);
    }
  };

  const handleTextboardChange = (e) => {
    const content = e.target.value;
    onUpdate({
      data: JSON.stringify({ content })
    });
  };

  const renderContent = () => {
    if (item.type === 'textboard') {
      const data = item.data ? JSON.parse(item.data) : {};
      return (
        <textarea
          className="textboard-content"
          value={data.content || ''}
          onChange={handleTextboardChange}
          placeholder="Начните печатать..."
          disabled={!isEditing && !editMode}
        />
      );
    }

    if (item.type === 'database') {
      const data = item.data ? JSON.parse(item.data) : { columns: [], rows: [] };
      return (
        <div className="database-preview">
          <div className="database-stats">
            {data.columns?.length || 0} колонок · {data.rows?.length || 0} строк
          </div>
        </div>
      );
    }

    if (item.type === 'folder') {
      return (
        <div className="folder-preview">
          <p className="folder-hint">Нажмите, чтобы открыть</p>
        </div>
      );
    }

    if (item.type === 'document') {
      return (
        <div className="document-preview">
          <p className="document-hint">Текстовый документ</p>
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className={`site-widget site-widget--${item.type} ${editMode ? 'edit-mode' : ''}`}
      onClick={handleClick}
    >
      {editMode && (
        <div className="site-widget__drag-handle">
          <GripVertical size={16} />
        </div>
      )}

      <div className="site-widget__header">
        <div className="site-widget__icon">{getIcon()}</div>
        <div className="site-widget__title-group">
          <h3 className="site-widget__name">{item.name}</h3>
          <span className="site-widget__type">{getTypeLabel()}</span>
        </div>
        {editMode && (
          <button
            className="site-widget__delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="site-widget__content">
        {renderContent()}
      </div>
    </div>
  );
}

export default SiteWidget;
