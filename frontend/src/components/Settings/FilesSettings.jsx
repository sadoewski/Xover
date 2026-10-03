import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, FolderTree, FileText } from 'lucide-react';
import { rwprintService } from '../../services/api';
import './FilesSettings.css';

export default function FilesSettings() {
  const [environments, setEnvironments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [expandedItems, setExpandedItems] = useState({});
  const [loading, setLoading] = useState(true);

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

    return (
      <div key={`env-${env.id}`} className="tree-item-group environment-group">
        <div
          className="tree-item environment-item"
          onClick={() => hasChildren && toggleExpand('env', env.id)}
        >
          <div className="tree-item-content">
            {hasChildren ? (
              expanded ? <ChevronDown size={18} className="tree-chevron" /> : <ChevronRight size={18} className="tree-chevron" />
            ) : (
              <span className="tree-spacer"></span>
            )}
            <div className="environment-icon" style={{ background: env.color || '#6366f1' }}></div>
            <span className="tree-label environment-label">{env.name}</span>
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
