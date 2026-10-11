import { useState, useEffect } from 'react';
import { Link2, ExternalLink, X, Plus, FileText } from 'lucide-react';
import { rwprintService, tasksService } from '../services/api';
import './DocumentLinks.css';

export default function DocumentLinks({ documentId, onNavigateToDocument }) {
  const [links, setLinks] = useState([]);
  const [taskLinks, setTaskLinks] = useState([]);
  const [showAddDocument, setShowAddDocument] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [availableDocuments, setAvailableDocuments] = useState([]);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (documentId) {
      loadLinks();
      loadTaskLinks();
    }
  }, [documentId]);

  const loadLinks = async () => {
    try {
      const result = await rwprintService.getDocumentLinks(documentId);
      setLinks(result);
    } catch (error) {
      console.error('Ошибка загрузки связей:', error);
    }
  };

  const loadTaskLinks = async () => {
    try {
      const result = await rwprintService.getDocumentTaskLinks(documentId);
      setTaskLinks(result);
    } catch (error) {
      console.error('Ошибка загрузки связей с задачами:', error);
    }
  };

  const loadAvailableDocuments = async () => {
    try {
      const environments = await rwprintService.getEnvironments();
      const allDocs = [];

      for (const env of environments) {
        const docs = await rwprintService.getDocuments(env.id);
        allDocs.push(...docs.filter(d => d.id !== documentId));
      }

      setAvailableDocuments(allDocs);
    } catch (error) {
      console.error('Ошибка загрузки документов:', error);
    }
  };

  const loadAvailableTasks = async () => {
    try {
      const tasks = await tasksService.getTasks();
      setAvailableTasks(tasks);
    } catch (error) {
      console.error('Ошибка загрузки задач:', error);
    }
  };

  const handleAddDocumentLink = async (targetDocId) => {
    try {
      await rwprintService.linkDocuments(documentId, targetDocId);
      await loadLinks();
      setShowAddDocument(false);
      setSearchQuery('');
    } catch (error) {
      console.error('Ошибка создания связи:', error);
      alert('Ошибка при создании связи');
    }
  };

  const handleRemoveDocumentLink = async (linkId, targetDocId) => {
    try {
      await rwprintService.unlinkDocuments(documentId, targetDocId);
      await loadLinks();
    } catch (error) {
      console.error('Ошибка удаления связи:', error);
    }
  };

  const handleAddTaskLink = async (taskId) => {
    try {
      await rwprintService.linkDocumentToTask(documentId, taskId);
      await loadTaskLinks();
      setShowAddTask(false);
      setSearchQuery('');
    } catch (error) {
      console.error('Ошибка связывания с задачей:', error);
      alert('Ошибка при связывании с задачей');
    }
  };

  const handleRemoveTaskLink = async (taskId) => {
    try {
      await rwprintService.unlinkDocumentFromTask(documentId, taskId);
      await loadTaskLinks();
    } catch (error) {
      console.error('Ошибка удаления связи:', error);
    }
  };

  const filteredDocuments = availableDocuments.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="document-links-panel">
      <div className="links-section">
        <div className="links-section-header">
          <Link2 size={16} />
          <span>Связанные документы</span>
          <button
            className="add-link-btn"
            onClick={() => {
              setShowAddDocument(!showAddDocument);
              if (!showAddDocument) loadAvailableDocuments();
            }}
            title="Добавить связь"
          >
            <Plus size={14} />
          </button>
        </div>

        {showAddDocument && (
          <div className="add-link-dropdown">
            <input
              type="text"
              className="link-search-input"
              placeholder="Поиск документа..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <div className="link-options-list">
              {filteredDocuments.length === 0 ? (
                <div className="no-options">Документы не найдены</div>
              ) : (
                filteredDocuments.map(doc => (
                  <div
                    key={doc.id}
                    className="link-option"
                    onClick={() => handleAddDocumentLink(doc.id)}
                  >
                    <FileText size={14} />
                    <span>{doc.title}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="links-list">
          {links.length === 0 ? (
            <div className="no-links">Нет связей</div>
          ) : (
            links.map(link => (
              <div key={link.id} className="link-item">
                <ExternalLink size={14} className="link-icon" />
                <span
                  className="link-title"
                  onClick={() => onNavigateToDocument(link.linked_document_id)}
                >
                  {link.linked_document_title}
                </span>
                <span className="link-direction">{link.direction === 'outgoing' ? '→' : '←'}</span>
                <button
                  className="remove-link-btn"
                  onClick={() => handleRemoveDocumentLink(link.id, link.linked_document_id)}
                  title="Удалить связь"
                >
                  <X size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="links-section">
        <div className="links-section-header">
          <FileText size={16} />
          <span>Связанные задачи</span>
          <button
            className="add-link-btn"
            onClick={() => {
              setShowAddTask(!showAddTask);
              if (!showAddTask) loadAvailableTasks();
            }}
            title="Добавить задачу"
          >
            <Plus size={14} />
          </button>
        </div>

        {showAddTask && (
          <div className="add-link-dropdown">
            <input
              type="text"
              className="link-search-input"
              placeholder="Поиск задачи..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <div className="link-options-list">
              {availableTasks.filter(task =>
                task.title.toLowerCase().includes(searchQuery.toLowerCase())
              ).length === 0 ? (
                <div className="no-options">Задачи не найдены</div>
              ) : (
                availableTasks
                  .filter(task => task.title.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(task => (
                    <div
                      key={task.id}
                      className="link-option"
                      onClick={() => handleAddTaskLink(task.id)}
                    >
                      <FileText size={14} />
                      <span>{task.title}</span>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        <div className="links-list">
          {taskLinks.length === 0 ? (
            <div className="no-links">Нет связей с задачами</div>
          ) : (
            taskLinks.map(link => (
              <div key={link.id} className="link-item task-link-item">
                <div className="task-link-info">
                  <span className="task-link-title">{link.task_title}</span>
                  <span className="task-link-date">{new Date(link.task_date).toLocaleDateString('ru-RU')}</span>
                </div>
                <button
                  className="remove-link-btn"
                  onClick={() => handleRemoveTaskLink(link.task_id)}
                  title="Удалить связь"
                >
                  <X size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
