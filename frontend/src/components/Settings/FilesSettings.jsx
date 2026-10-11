import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, FolderTree, FileText, Edit2, Check, X } from 'lucide-react';
import { rwprintService } from '../../services/api';
import './FilesSettings.css';

export default function FilesSettings() {
  const [environments, setEnvironments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [expandedItems, setExpandedItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingEnvId, setEditingEnvId] = useState(null);
  const [editingEnvName, setEditingEnvName] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const envsData = await rwprintService.getEnvironments();
      setEnvironments(envsData);

      // Загружаем папки и документы для всех окружений
      const allFolders = [];
      const allDocuments = [];

      for (const env of envsData) {
        const [foldersData, docsData] = await Promise.all([
          rwprintService.getFolders(env.id),
          rwprintService.getDocuments(env.id)
        ]);
        allFolders.push(...foldersData);
        allDocuments.push(...docsData);
      }

      setFolders(allFolders);
      setDocuments(allDocuments);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (type, id) => {
    const key = `${type}-${id}`;
    setExpandedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isExpanded = (type, id) => expandedItems[`${type}-${id}`];

  const startEditEnvironment = (env, e) => {
    e.stopPropagation();
    setEditingEnvId(env.id);
    setEditingEnvName(env.name);
  };

  const saveEnvironmentName = async (envId) => {
    if (!editingEnvName.trim()) return;

    try {
      await rwprintService.updateEnvironment(envId, { name: editingEnvName.trim() });
      setEnvironments(prev => prev.map(env =>
        env.id === envId ? { ...env, name: editingEnvName.trim() } : env
      ));
      setEditingEnvId(null);
      setEditingEnvName('');
    } catch (error) {
      console.error('Ошибка обновления окружения:', error);
      alert('Ошибка при сохранении названия');
    }
  };

  const cancelEditEnvironment = () => {
    setEditingEnvId(null);
    setEditingEnvName('');
  };

  const renderDocument = (doc, level) => {
    return (
      <div key={`doc-${doc.id}`} className="tree-item" style={{ paddingLeft: `${level * 24}px` }}>
        <div className="tree-item-content">
          <span className="tree-spacer"></span>
          <FileText size={16} className="tree-icon document" />
          <span className="tree-label">{doc.title}</span>
        </div>
      </div>
    );
  };

  const renderFolder = (folder, level) => {
    const childFolders = folders.filter(f => f.parent_folder_id === folder.id);
    const childDocs = documents.filter(d => d.folder_id === folder.id);
    const hasChildren = childFolders.length > 0 || childDocs.length > 0;
    const expanded = isExpanded('folder', folder.id);

    return (
      <div key={`folder-${folder.id}`} className="tree-item-group">
        <div
          className="tree-item"
          style={{ paddingLeft: `${level * 24}px` }}
          onClick={() => hasChildren && toggleExpand('folder', folder.id)}
        >
          <div className="tree-item-content">
            {hasChildren ? (
              expanded ? <ChevronDown size={16} className="tree-chevron" /> : <ChevronRight size={16} className="tree-chevron" />
            ) : (
              <span className="tree-spacer"></span>
            )}
            <FolderTree size={16} className="tree-icon folder" />
            <span className="tree-label">{folder.name}</span>
          </div>
        </div>
        {expanded && hasChildren && (
          <div className="tree-children">
            {childFolders.map(f => renderFolder(f, level + 1))}
            {childDocs.map(d => renderDocument(d, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderEnvironment = (env) => {
    const envFolders = folders.filter(f => f.environment_id === env.id && !f.parent_folder_id);
    const envDocs = documents.filter(d => d.environment_id === env.id && !d.folder_id);
    const hasChildren = envFolders.length > 0 || envDocs.length > 0;
    const expanded = isExpanded('env', env.id);
    const isEditing = editingEnvId === env.id;

    return (
      <div key={`env-${env.id}`} className="tree-item-group environment-group">
        <div
          className="tree-item environment-item"
          onClick={() => !isEditing && hasChildren && toggleExpand('env', env.id)}
        >
          <div className="tree-item-content">
            {hasChildren ? (
              expanded ? <ChevronDown size={18} className="tree-chevron" /> : <ChevronRight size={18} className="tree-chevron" />
            ) : (
              <span className="tree-spacer"></span>
            )}
            <div className="environment-icon" style={{ background: env.color || '#6366f1' }}></div>
            {isEditing ? (
              <div className="environment-edit-group">
                <input
                  type="text"
                  className="environment-name-input"
                  value={editingEnvName}
                  onChange={(e) => setEditingEnvName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEnvironmentName(env.id);
                    if (e.key === 'Escape') cancelEditEnvironment();
                  }}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  className="env-edit-btn save"
                  onClick={(e) => {
                    e.stopPropagation();
                    saveEnvironmentName(env.id);
                  }}
                  title="Сохранить"
                >
                  <Check size={14} />
                </button>
                <button
                  className="env-edit-btn cancel"
                  onClick={(e) => {
                    e.stopPropagation();
                    cancelEditEnvironment();
                  }}
                  title="Отменить"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <span className="tree-label environment-label">{env.name}</span>
                <button
                  className="env-edit-btn"
                  onClick={(e) => startEditEnvironment(env, e)}
                  title="Редактировать название"
                >
                  <Edit2 size={14} />
                </button>
              </>
            )}
          </div>
        </div>
        {expanded && hasChildren && (
          <div className="tree-children">
            {envFolders.map(f => renderFolder(f, 1))}
            {envDocs.map(d => renderDocument(d, 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="files-settings loading">Загрузка...</div>;
  }

  return (
    <div className="files-settings">
      <h2>Файлы RW:Print</h2>
      <div className="files-tree">
        {environments.length === 0 ? (
          <p className="empty-state">Нет окружений</p>
        ) : (
          environments.map(env => renderEnvironment(env))
        )}
      </div>
    </div>
  );
}
