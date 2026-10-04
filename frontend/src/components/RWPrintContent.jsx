import { useState, useEffect } from 'react';
import {
  FolderTree,
  Globe,
  Bookmark,
  Plus,
  FolderPlus,
  Settings,
  ArrowUpDown,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  FileText,
  Lock,
  Save,
  Columns2,
  Trash2,
  X,
  Check,
} from 'lucide-react';
import { rwprintService } from '../services/rwprint';
import DocumentEditor from './DocumentEditor';
import SitesPage from '../pages/SitesPage';
import './RWPrintContent.css';

export default function RWPrintContent() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('rwprintSidebarCollapsed');
    return saved === 'true';
  });
  const [activeTab, setActiveTab] = useState('files'); // files, sites, bookmarks
  const [environments, setEnvironments] = useState([]);
  const [currentEnvironment, setCurrentEnvironment] = useState(null);
  const [folders, setFolders] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [bookmarkedDocuments, setBookmarkedDocuments] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [currentFolder, setCurrentFolder] = useState(null);

  // Множественные открытые документы (вкладки)
  const [openTabs, setOpenTabs] = useState([]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const [sortBy, setSortBy] = useState('newest');
  const [showEnvironmentSelector, setShowEnvironmentSelector] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState({ saved: false, time: null });
  const [splitViewEnabled, setSplitViewEnabled] = useState(false);
  const [rightDocument, setRightDocument] = useState(null);
  const [leftWidth, setLeftWidth] = useState(50); // Процент ширины левого редактора
  const [isResizing, setIsResizing] = useState(false);

  // Режим множественного выбора для удаления
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  // Состояние подсветки синтаксиса для каждого документа
  const [syntaxHighlightStates, setSyntaxHighlightStates] = useState({});

  // Получаем текущий активный документ
  const selectedDocument = openTabs[activeTabIndex] || null;

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const newValue = !prev;
      localStorage.setItem('rwprintSidebarCollapsed', String(newValue));
      return newValue;
    });
  };

  // Функции для сохранения и восстановления состояния
  const saveAppState = () => {
    const state = {
      activeTab,
      currentEnvironmentId: currentEnvironment?.id,
      currentFolderId: currentFolder?.id,
      expandedFolders,
      sortBy,
      splitViewEnabled,
      leftWidth,
      openTabs: openTabs.map(tab => ({ id: tab.id, title: tab.title })),
      activeTabIndex,
      rightDocumentId: rightDocument?.id,
      syntaxHighlightStates,
    };
    localStorage.setItem('rwprintAppState', JSON.stringify(state));
  };

  const restoreAppState = async () => {
    const saved = localStorage.getItem('rwprintAppState');
    if (!saved) return false;

    try {
      const state = JSON.parse(saved);

      // Восстанавливаем базовые настройки
      if (state.activeTab) setActiveTab(state.activeTab);
      if (state.sortBy) setSortBy(state.sortBy);
      if (state.expandedFolders) setExpandedFolders(state.expandedFolders);
      if (state.splitViewEnabled !== undefined) setSplitViewEnabled(state.splitViewEnabled);
      if (state.leftWidth) setLeftWidth(state.leftWidth);
      if (state.syntaxHighlightStates) setSyntaxHighlightStates(state.syntaxHighlightStates);

      // Восстанавливаем окружение
      if (state.currentEnvironmentId && environments.length > 0) {
        const env = environments.find(e => e.id === state.currentEnvironmentId);
        if (env) {
          setCurrentEnvironment(env);

          // Восстанавливаем папку
          if (state.currentFolderId) {
            try {
              const foldersData = await rwprintService.getFolders(env.id);
              const folder = foldersData.folders.find(f => f.id === state.currentFolderId);
              if (folder) setCurrentFolder(folder);
            } catch (error) {
              console.error('Ошибка восстановления папки:', error);
            }
          }

          // Восстанавливаем открытые вкладки
          if (state.openTabs && state.openTabs.length > 0) {
            const loadedTabs = [];
            for (const tab of state.openTabs) {
              try {
                const data = await rwprintService.getDocumentById(tab.id);
                loadedTabs.push(data.document);
              } catch (error) {
                console.error(`Не удалось загрузить документ ${tab.id}:`, error);
              }
            }
            if (loadedTabs.length > 0) {
              setOpenTabs(loadedTabs);
              if (state.activeTabIndex !== undefined && state.activeTabIndex < loadedTabs.length) {
                setActiveTabIndex(state.activeTabIndex);
              }
            }
          }

          // Восстанавливаем правый документ в split view
          if (state.splitViewEnabled && state.rightDocumentId) {
            try {
              const data = await rwprintService.getDocumentById(state.rightDocumentId);
              setRightDocument(data.document);
            } catch (error) {
              console.error('Не удалось загрузить правый документ:', error);
            }
          }

          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Ошибка восстановления состояния:', error);
      return false;
    }
  };

  useEffect(() => {
    loadEnvironments();
  }, []);

  useEffect(() => {
    if (currentEnvironment) {
      loadFolders();
      loadDocuments();
      loadRecentDocuments();
    }
  }, [currentEnvironment, currentFolder, sortBy]);

  useEffect(() => {
    if (activeTab === 'bookmarks') {
      loadAllBookmarks();
    }
  }, [activeTab]);

  // Восстановление состояния после загрузки окружений
  useEffect(() => {
    if (environments.length > 0 && !currentEnvironment) {
      restoreAppState().then(restored => {
        // Если состояние не восстановлено, устанавливаем первое окружение
        if (!restored) {
          setCurrentEnvironment(environments[0]);
        }
      });
    }
  }, [environments]);

  // Сохранение состояния при изменениях
  useEffect(() => {
    if (!loading && currentEnvironment) {
      saveAppState();
    }
  }, [
    activeTab,
    currentEnvironment,
    currentFolder,
    expandedFolders,
    sortBy,
    splitViewEnabled,
    leftWidth,
    openTabs,
    activeTabIndex,
    rightDocument,
    syntaxHighlightStates,
  ]);

  const loadEnvironments = async () => {
    try {
      const data = await rwprintService.getEnvironments();
      setEnvironments(data.environments);
      // Не устанавливаем дефолтное окружение здесь - это делает useEffect с восстановлением состояния
      setLoading(false);
    } catch (error) {
      console.error('Ошибка загрузки окружений:', error);
      setLoading(false);
    }
  };

  const loadFolders = async () => {
    if (!currentEnvironment) return;
    try {
      const data = await rwprintService.getFolders(currentEnvironment.id);
      setFolders(data.folders);
    } catch (error) {
      console.error('Ошибка загрузки папок:', error);
    }
  };

  const loadDocuments = async () => {
    if (!currentEnvironment) return;
    try {
      const bookmarked = activeTab === 'bookmarks';
      const data = await rwprintService.getDocuments(
        currentEnvironment.id,
        currentFolder?.id || null,
        bookmarked,
        sortBy
      );
      setDocuments(data.documents);

      // Если это вкладка закладок, обновляем список закладок
      if (bookmarked) {
        setBookmarkedDocuments(data.documents);
      }
    } catch (error) {
      console.error('Ошибка загрузки документов:', error);
    }
  };

  const loadRecentDocuments = async () => {
    if (!currentEnvironment) return;
    try {
      const data = await rwprintService.getDocuments(
        currentEnvironment.id,
        null,
        false,
        'newest'
      );
      setRecentDocuments(data.documents.slice(0, 10));
    } catch (error) {
      console.error('Ошибка загрузки недавних документов:', error);
    }
  };

  const loadAllBookmarks = async () => {
    try {
      const data = await rwprintService.getAllBookmarks();
      setBookmarkedDocuments(data.bookmarks);
    } catch (error) {
      console.error('Ошибка загрузки закладок:', error);
    }
  };

  // Функции для работы с вкладками
  const openDocumentInTab = (doc) => {
    // Проверяем, открыт ли уже этот документ
    const existingTabIndex = openTabs.findIndex(tab => tab.id === doc.id);
    if (existingTabIndex !== -1) {
      // Переключаемся на существующую вкладку
      setActiveTabIndex(existingTabIndex);
    } else {
      // Открываем новую вкладку
      setOpenTabs(prev => {
        const newTabs = [...prev, doc];
        setActiveTabIndex(newTabs.length - 1);
        return newTabs;
      });
    }
  };

  const closeTab = (index) => {
    const newTabs = openTabs.filter((_, i) => i !== index);
    setOpenTabs(newTabs);

    // Если закрываем активную вкладку, переключаемся на предыдущую
    if (index === activeTabIndex) {
      setActiveTabIndex(Math.max(0, index - 1));
    } else if (index < activeTabIndex) {
      setActiveTabIndex(activeTabIndex - 1);
    }

    // Удаляем состояние подсветки для закрытого документа
    const closedDocId = openTabs[index]?.id;
    if (closedDocId) {
      setSyntaxHighlightStates(prev => {
        const newStates = { ...prev };
        delete newStates[closedDocId];
        return newStates;
      });
    }
  };

  // Функции для управления состоянием подсветки синтаксиса
  const handleSyntaxHighlightChange = (documentId, enabled) => {
    setSyntaxHighlightStates(prev => ({
      ...prev,
      [documentId]: enabled
    }));
  };

  // Функции для работы с закладками
  const toggleBookmark = async (documentId) => {
    try {
      const doc = openTabs.find(d => d.id === documentId) || documents.find(d => d.id === documentId);
      if (!doc) return;

      const newBookmarkedState = !doc.is_bookmarked;

      await rwprintService.updateDocument(documentId, {
        is_bookmarked: newBookmarkedState
      });

      // Обновляем состояние в открытых вкладках с функциональным обновлением
      setOpenTabs(prev => prev.map(tab =>
        tab.id === documentId ? { ...tab, is_bookmarked: newBookmarkedState } : tab
      ));

      // Если мы на вкладке "Избранное", загружаем все закладки
      if (activeTab === 'bookmarks') {
        loadAllBookmarks();
      } else {
        // Иначе перезагружаем документы текущего окружения
        loadDocuments();
      }

      // Обновляем список закладок для быстрого доступа
      if (newBookmarkedState) {
        // Добавляем документ в закладки
        setBookmarkedDocuments(prev => {
          // Проверяем, нет ли уже этого документа
          if (prev.some(d => d.id === documentId)) {
            return prev;
          }
          return [...prev, { ...doc, is_bookmarked: true }];
        });
      } else {
        // Удаляем документ из закладок
        setBookmarkedDocuments(prev => prev.filter(d => d.id !== documentId));
      }
    } catch (error) {
      console.error('Ошибка переключения закладки:', error);
    }
  };

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const handleCreateDocument = async () => {
    if (!currentEnvironment) return;
    try {
      // Создаём документ без названия - оно будет из первой строки
      const result = await rwprintService.createDocument(currentEnvironment.id, {
        title: 'Новый документ',
        folder_id: currentFolder?.id || null,
        content: '',
        format: 'md',
      });

      // Открываем документ в новой вкладке
      openDocumentInTab(result.document);
      loadDocuments();
      loadRecentDocuments();
    } catch (error) {
      console.error('Ошибка создания документа:', error);
      alert('Ошибка создания документа');
    }
  };

  const handleCreateFolder = async () => {
    if (!currentEnvironment) return;
    try {
      const name = prompt('Название папки:');
      if (!name) return;

      await rwprintService.createFolder(
        currentEnvironment.id,
        name,
        currentFolder?.id || null
      );
      loadFolders();
    } catch (error) {
      console.error('Ошибка создания папки:', error);
      alert('Ошибка создания папки');
    }
  };

  const handleCreateEnvironment = async () => {
    try {
      const name = prompt('Название окружения:');
      if (!name) return;

      await rwprintService.createEnvironment(name, '');
      loadEnvironments();
    } catch (error) {
      console.error('Ошибка создания окружения:', error);
      alert('Ошибка создания окружения');
    }
  };

  const handleSaveDocument = async (documentId, documentData) => {
    try {
      // Используем функциональное обновление для получения актуального состояния
      let currentDocument;
      setOpenTabs(prev => {
        currentDocument = prev.find(tab => tab.id === documentId);
        return prev;
      });

      if (!currentDocument) {
        console.error('Документ не найден в открытых вкладках:', documentId);
        return;
      }

      const updatedDocument = { ...currentDocument, ...documentData, id: documentId };

      // Убедимся, что folder_id сохраняется, если он не передан в documentData
      const dataToSave = {
        ...documentData,
        folder_id: documentData.folder_id !== undefined ? documentData.folder_id : currentDocument.folder_id
      };

      await rwprintService.updateDocument(documentId, dataToSave);

      // Обновляем документ в открытых вкладках с функциональным обновлением
      setOpenTabs(prev => prev.map(tab =>
        tab.id === documentId ? updatedDocument : tab
      ));

      setSaveStatus({ saved: true, time: new Date() });
      loadDocuments();
      loadRecentDocuments();

      // Сбросить статус через 3 секунды
      setTimeout(() => {
        setSaveStatus({ saved: false, time: null });
      }, 3000);
    } catch (error) {
      console.error('Ошибка сохранения документа:', error);
      setSaveStatus({ saved: false, time: null });
    }
  };

  const handleToggleBookmark = async (documentId) => {
    try {
      // Используем функциональное обновление для получения актуального документа
      let document;
      setOpenTabs(prev => {
        document = prev.find(tab => tab.id === documentId);
        return prev;
      });

      if (!document) return;

      const newBookmarkState = !document.is_bookmarked;
      await rwprintService.updateDocument(documentId, { is_bookmarked: newBookmarkState });

      // Обновляем документ в открытых вкладках с функциональным обновлением
      setOpenTabs(prev => prev.map(tab =>
        tab.id === documentId ? { ...tab, is_bookmarked: newBookmarkState } : tab
      ));

      // Перезагружаем закладки если мы на вкладке закладок
      if (activeTab === 'bookmarks') {
        loadAllBookmarks();
      }
      loadDocuments();
    } catch (error) {
      console.error('Ошибка переключения закладки:', error);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    try {
      await rwprintService.deleteDocument(documentId);

      // Удаляем из открытых вкладок
      const tabIndex = openTabs.findIndex(tab => tab.id === documentId);
      if (tabIndex !== -1) {
        closeTab(tabIndex);
      }

      loadDocuments();
      loadRecentDocuments();
    } catch (error) {
      console.error('Ошибка удаления документа:', error);
      throw error;
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (!window.confirm('Удалить папку и все её содержимое?')) return;

    try {
      await rwprintService.deleteFolder(folderId);
      loadFolders();
      loadDocuments();
    } catch (error) {
      console.error('Ошибка удаления папки:', error);
      alert('Ошибка удаления папки');
    }
  };

  const handleDeleteEnvironment = async (envId) => {
    if (!window.confirm('Удалить окружение и все его содержимое?')) return;

    try {
      await rwprintService.deleteEnvironment(envId);
      loadEnvironments();

      // Если удалили текущее окружение, выбираем первое доступное
      if (currentEnvironment?.id === envId) {
        const remaining = environments.filter(e => e.id !== envId);
        setCurrentEnvironment(remaining[0] || null);
      }
    } catch (error) {
      console.error('Ошибка удаления окружения:', error);
      alert('Ошибка удаления окружения');
    }
  };

  // Функции для множественного выбора и удаления
  const toggleMultiSelectMode = () => {
    setMultiSelectMode(!multiSelectMode);
    setSelectedItems([]);
  };

  const toggleItemSelection = (itemId, itemType) => {
    const key = `${itemType}-${itemId}`;
    if (selectedItems.includes(key)) {
      setSelectedItems(selectedItems.filter(id => id !== key));
    } else {
      setSelectedItems([...selectedItems, key]);
    }
  };

  const selectAllInFolder = () => {
    const allItems = [
      ...documents
        .filter(doc => {
          // Выбираем только документы текущей папки
          if (currentFolder) {
            return doc.folder_id === currentFolder.id;
          } else {
            // В корне выбираем только документы без папки
            return !doc.folder_id || doc.folder_id === null;
          }
        })
        .map(d => `document-${d.id}`),
      ...folders.filter(f => f.parent_folder_id === currentFolder?.id || (!f.parent_folder_id && !currentFolder))
        .map(f => `folder-${f.id}`)
    ];
    setSelectedItems(allItems);
  };

  const deleteSelectedItems = async () => {
    if (selectedItems.length === 0) return;
    if (!window.confirm(`Удалить выбранные элементы (${selectedItems.length})?`)) return;

    try {
      for (const item of selectedItems) {
        const [type, id] = item.split('-');
        if (type === 'document') {
          await rwprintService.deleteDocument(parseInt(id));
        } else if (type === 'folder') {
          await rwprintService.deleteFolder(parseInt(id));
        }
      }

      setSelectedItems([]);
      setMultiSelectMode(false);
      loadFolders();
      loadDocuments();
    } catch (error) {
      console.error('Ошибка удаления элементов:', error);
      alert('Ошибка при удалении некоторых элементов');
    }
  };

  const handleCloseEditor = () => {
    // Закрываем активную вкладку
    if (openTabs.length > 0) {
      closeTab(activeTabIndex);
    }

    // Если split view включен и есть правый документ, закрываем split view
    if (splitViewEnabled) {
      setSplitViewEnabled(false);
      setRightDocument(null);
    }
  };

  const handleCloseRightEditor = () => {
    setRightDocument(null);
    // Закрываем split view при закрытии правого документа
    setSplitViewEnabled(false);
  };

  const toggleSplitView = () => {
    if (splitViewEnabled) {
      // Выключаем split view - закрываем правый документ
      setRightDocument(null);
      setSplitViewEnabled(false);
    } else {
      // Включаем split view только если есть левый документ
      if (selectedDocument) {
        setSplitViewEnabled(true);
        // Правый документ НЕ открываем автоматически - юзер выберет
      }
    }
  };

  // Обработка выбора документа для правой панели
  const handleRightDocumentSelect = async (doc) => {
    try {
      // Проверяем, не открыт ли уже этот документ слева
      if (selectedDocument && selectedDocument.id === doc.id) {
        alert('Этот документ уже открыт в левой панели');
        return;
      }

      if (doc.is_password_protected) {
        const password = prompt('Введите пароль для документа:');
        if (!password) return;
        const data = await rwprintService.getDocumentById(doc.id, password);
        setRightDocument(data.document);
      } else {
        const data = await rwprintService.getDocumentById(doc.id);
        setRightDocument(data.document);
      }
    } catch (error) {
      console.error('Error opening document:', error);
      alert('Не удалось открыть документ');
    }
  };

  // Создание нового документа для правой панели
  const handleCreateRightDocument = async () => {
    try {
      // Получаем окружение из левого документа если есть
      const envId = selectedDocument?.environment_id || currentEnvironment?.id;
      if (!envId) {
        alert('Выберите окружение');
        return;
      }

      const newDoc = await rwprintService.createDocument(envId, {
        title: 'Новый документ',
        content: '',
        format: 'md',
        folder_id: selectedDocument?.folder_id || null,
      });

      setRightDocument(newDoc.document);
      loadRecentDocuments();
    } catch (error) {
      console.error('Error creating document:', error);
      alert('Не удалось создать документ');
    }
  };

  // Resizable split view
  const handleMouseDown = (e) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      const container = document.querySelector('.editors-container');
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

      // Ограничиваем ширину от 20% до 80%
      if (newLeftWidth >= 20 && newLeftWidth <= 80) {
        setLeftWidth(newLeftWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.document.addEventListener('mousemove', handleMouseMove);
    window.document.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.document.removeEventListener('mousemove', handleMouseMove);
      window.document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleDocumentClick = async (doc) => {
    try {
      if (doc.is_password_protected) {
        const password = prompt('Введите пароль для документа:');
        if (!password) return;

        const data = await rwprintService.getDocumentById(doc.id, password);

        // Если split view включен и правый документ не открыт, открываем справа
        if (splitViewEnabled && !rightDocument) {
          setRightDocument(data.document);
        } else {
          // Открываем в новой вкладке
          openDocumentInTab(data.document);
        }
      } else {
        const data = await rwprintService.getDocumentById(doc.id);

        // Если split view включен и правый документ не открыт, открываем справа
        if (splitViewEnabled && !rightDocument) {
          setRightDocument(data.document);
        } else {
          // Открываем в новой вкладке
          openDocumentInTab(data.document);
        }
      }
    } catch (error) {
      console.error('Ошибка открытия документа:', error);
      alert('Не удалось открыть документ. Проверьте пароль.');
    }
  };

  const buildFolderTree = () => {
    const rootFolders = folders.filter(f => !f.parent_folder_id);
    const renderFolder = (folder, level = 0) => {
      const children = folders.filter(f => f.parent_folder_id === folder.id);
      const isExpanded = expandedFolders[folder.id];
      const isSelected = currentFolder?.id === folder.id;
      const itemKey = `folder-${folder.id}`;
      const isItemSelected = selectedItems.includes(itemKey);

      return (
        <div key={folder.id} className="folder-item">
          <div className="folder-row">
            {multiSelectMode && (
              <input
                type="checkbox"
                checked={isItemSelected}
                onChange={() => toggleItemSelection(folder.id, 'folder')}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <button
              className={`folder-button ${isSelected ? 'selected' : ''}`}
              style={{ paddingLeft: `${level * 16 + 8}px` }}
              onClick={() => {
                setCurrentFolder(folder);
                toggleFolder(folder.id);
              }}
            >
              {children.length > 0 && (
                <span className="folder-chevron">
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
              )}
              <FolderTree size={16} />
              <span className="folder-name">{folder.name}</span>
            </button>
            {!multiSelectMode && (
              <button
                className="delete-icon-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFolder(folder.id);
                }}
                title="Удалить папку"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
          {isExpanded && children.length > 0 && (
            <div className="folder-children">
              {children.map(child => renderFolder(child, level + 1))}
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="folder-tree">
        {rootFolders.map(folder => renderFolder(folder))}
      </div>
    );
  };

  const getWordAndCharCount = () => {
    if (!selectedDocument) return { words: 0, chars: 0 };
    return {
      words: selectedDocument.word_count || 0,
      chars: selectedDocument.char_count || 0,
    };
  };

  const stats = getWordAndCharCount();

  if (loading) {
    return <div className="rwprint-content loading">Загрузка...</div>;
  }

  return (
    <div className="rwprint-container">
      {/* Sidebar */}
      <div className={`rwprint-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-tabs-vertical">
          <button
            className={`tab-btn-vertical ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => setActiveTab('files')}
            title="Файлы"
          >
            <FolderTree size={20} />
            {!sidebarCollapsed && <span>Файлы</span>}
          </button>
          <button
            className={`tab-btn-vertical ${activeTab === 'sites' ? 'active' : ''}`}
            onClick={() => setActiveTab('sites')}
            title="Сайты"
          >
            <Globe size={20} />
            {!sidebarCollapsed && <span>Сайты</span>}
          </button>
          <button
            className={`tab-btn-vertical ${activeTab === 'bookmarks' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('bookmarks');
              setCurrentFolder(null);
            }}
            title="Закладки"
          >
            <Bookmark size={20} />
            {!sidebarCollapsed && <span>Закладки</span>}
          </button>
        </div>

        {!sidebarCollapsed && (
          <div className="sidebar-content">
            {activeTab === 'files' && (
              <>
                {currentFolder && (
                  <button
                    className="back-button"
                    onClick={() => setCurrentFolder(null)}
                  >
                    ← Назад в корень
                  </button>
                )}
                {buildFolderTree()}
                <div className="documents-list">
                  {documents
                    .filter(doc => {
                      // Показываем только документы текущей папки
                      if (currentFolder) {
                        return doc.folder_id === currentFolder.id;
                      } else {
                        // В корне показываем только документы без папки
                        return !doc.folder_id || doc.folder_id === null;
                      }
                    })
                    .map(doc => {
                    const itemKey = `document-${doc.id}`;
                    const isItemSelected = selectedItems.includes(itemKey);
                    return (
                      <div key={doc.id} className="document-row">
                        {multiSelectMode && (
                          <input
                            type="checkbox"
                            checked={isItemSelected}
                            onChange={() => toggleItemSelection(doc.id, 'document')}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                        <button
                          className={`document-item ${selectedDocument?.id === doc.id ? 'selected' : ''}`}
                          onClick={() => handleDocumentClick(doc)}
                        >
                          <FileText size={16} />
                          <span className="document-title">{doc.title}</span>
                          {doc.is_password_protected && <Lock size={12} />}
                        </button>
                        {!multiSelectMode && (
                          <button
                            className="delete-icon-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Удалить документ?')) {
                                handleDeleteDocument(doc.id);
                              }
                            }}
                            title="Удалить документ"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {activeTab === 'sites' && (
              <div className="sites-sidebar-placeholder">
                <p className="placeholder-text">Выберите или создайте сайт</p>
              </div>
            )}

            {activeTab === 'bookmarks' && (
              <div className="bookmarks-list">
                {bookmarkedDocuments.length > 0 ? (
                  bookmarkedDocuments.map(doc => (
                    <button
                      key={doc.id}
                      className={`document-item ${selectedDocument?.id === doc.id ? 'selected' : ''}`}
                      onClick={() => handleDocumentClick(doc)}
                    >
                      <FileText size={16} />
                      <div className="bookmark-info">
                        <span className="document-title">{doc.title}</span>
                        <span className="environment-label">
                          {environments.find(e => e.id === doc.environment_id)?.name || 'Неизвестно'}
                        </span>
                      </div>
                      {doc.is_password_protected && <Lock size={12} />}
                    </button>
                  ))
                ) : (
                  <p className="placeholder-text">Нет закладок</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Environment Selector */}
        {!sidebarCollapsed && (
          <div className="sidebar-footer">
            {/* Кнопки множественного выбора */}
            {multiSelectMode && (
              <div className="multi-select-controls">
                <button className="btn-secondary" onClick={selectAllInFolder} title="Выбрать все">
                  Выбрать все
                </button>
                <button
                  className="btn-danger"
                  onClick={deleteSelectedItems}
                  disabled={selectedItems.length === 0}
                  title="Удалить выбранные"
                >
                  <Trash2 size={16} />
                  Удалить ({selectedItems.length})
                </button>
              </div>
            )}

            <div className="environment-selector">
              <button
                className="current-environment"
                onClick={() => setShowEnvironmentSelector(!showEnvironmentSelector)}
              >
                <span>{currentEnvironment?.name || 'Выберите окружение'}</span>
                <ChevronRight size={14} />
              </button>
              {showEnvironmentSelector && (
                <div className="environment-dropdown">
                  {environments.map(env => (
                    <div key={env.id} className="environment-row">
                      <button
                        className={`environment-item ${env.id === currentEnvironment?.id ? 'active' : ''}`}
                        onClick={() => {
                          setCurrentEnvironment(env);
                          setShowEnvironmentSelector(false);
                        }}
                      >
                        {env.name}
                      </button>
                      <button
                        className="delete-icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEnvironment(env.id);
                        }}
                        title="Удалить окружение"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button className="environment-create" onClick={handleCreateEnvironment}>
                    <Plus size={14} />
                    Создать окружение
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Footer с кнопкой toggle - всегда внизу */}
        <div className="sidebar-footer-toggle">
          {!sidebarCollapsed ? (
            <button
              className="sidebar-toggle-in-footer"
              onClick={toggleSidebar}
              title="Свернуть"
            >
              <ChevronLeft size={16} />
              <span>Свернуть</span>
            </button>
          ) : (
            <button
              className="sidebar-toggle-in-footer collapsed"
              onClick={toggleSidebar}
              title="Развернуть"
            >
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="rwprint-main">
        {/* Горизонтальные вкладки открытых документов */}
        {openTabs.length > 0 && (
          <div className="document-tabs">
            {openTabs.map((tab, index) => (
              <div
                key={tab.id}
                className={`document-tab ${index === activeTabIndex ? 'active' : ''}`}
                onClick={() => setActiveTabIndex(index)}
              >
                <span className="tab-title">{tab.title}</span>
                <button
                  className="tab-close"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(index);
                  }}
                  title="Закрыть"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'sites' ? (
          <SitesPage />
        ) : selectedDocument ? (
          <div className={`editors-container ${splitViewEnabled ? 'split-view' : ''}`}>
            {/* Левый редактор */}
            <div
              className="editor-pane left-pane"
              style={splitViewEnabled ? {
                flex: `0 0 calc(${leftWidth}% - 0.5px)`,
                width: `calc(${leftWidth}% - 0.5px)`
              } : {}}
            >
              <DocumentEditor
                key={selectedDocument.id}
                document={selectedDocument}
                onSave={handleSaveDocument}
                onClose={handleCloseEditor}
                onDelete={handleDeleteDocument}
                onToggleBookmark={toggleBookmark}
                saveStatus={saveStatus}
                syntaxHighlightEnabled={syntaxHighlightStates[selectedDocument.id]}
                onSyntaxHighlightChange={(enabled) => handleSyntaxHighlightChange(selectedDocument.id, enabled)}
              />
            </div>

            {/* Разделитель */}
            {splitViewEnabled && (
              <div
                className="split-resizer"
                onMouseDown={handleMouseDown}
              />
            )}

            {/* Правая панель */}
            {splitViewEnabled && (
              <div
                className="editor-pane right-pane"
                style={{
                  flex: `0 0 calc(${100 - leftWidth}% - 0.5px)`,
                  width: `calc(${100 - leftWidth}% - 0.5px)`
                }}
              >
                {rightDocument ? (
                  <DocumentEditor
                    key={rightDocument.id}
                    document={rightDocument}
                    onSave={handleSaveDocument}
                    onClose={() => {
                      setRightDocument(null);
                      setSplitViewEnabled(false);
                    }}
                    onDelete={handleDeleteDocument}
                    onToggleBookmark={toggleBookmark}
                    saveStatus={saveStatus}
                    syntaxHighlightEnabled={syntaxHighlightStates[rightDocument.id]}
                    onSyntaxHighlightChange={(enabled) => handleSyntaxHighlightChange(rightDocument.id, enabled)}
                  />
                ) : (
                  <div className="right-panel-selector">
                    <h3>Выберите документ</h3>

                    <button
                      className="btn-create-new"
                      onClick={handleCreateRightDocument}
                    >
                      <Plus size={20} />
                      Создать новый документ
                    </button>

                    <div className="recent-documents-right">
                      <h4>Недавние документы</h4>
                      <div className="recent-list">
                        {recentDocuments.length > 0 ? (
                          recentDocuments.map(doc => (
                            <button
                              key={doc.id}
                              className="recent-item"
                              onClick={() => handleRightDocumentSelect(doc)}
                            >
                              <FileText size={20} />
                              <div className="recent-info">
                                <span className="recent-title">{doc.title}</span>
                                <span className="recent-date">
                                  {new Date(doc.updated_at).toLocaleDateString('ru-RU')}
                                </span>
                              </div>
                              {doc.is_password_protected && <Lock size={14} />}
                            </button>
                          ))
                        ) : (
                          <p className="empty-recent">Нет недавних документов</p>
                        )}
                      </div>
                    </div>

                    <p className="hint-text">
                      Или выберите документ в дереве слева
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="recent-documents">
            <h3>Недавние документы</h3>
            <div className="recent-list">
              {recentDocuments.length > 0 ? (
                recentDocuments.map(doc => (
                  <button
                    key={doc.id}
                    className="recent-item"
                    onClick={() => handleDocumentClick(doc)}
                  >
                    <FileText size={20} />
                    <div className="recent-info">
                      <span className="recent-title">{doc.title}</span>
                      <span className="recent-date">
                        {new Date(doc.updated_at).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    {doc.is_password_protected && <Lock size={14} />}
                  </button>
                ))
              ) : (
                <p className="empty-recent">Нет недавних документов</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Downbar */}
      <div className="rwprint-downbar">
        <div className="downbar-left">
          {selectedDocument && (
            <div className="document-stats">
              <span>{stats.words} слов</span>
              <span>•</span>
              <span>{stats.chars} символов</span>
            </div>
          )}
        </div>
        <div className="downbar-center">
          <div className="save-status-indicator">
            <Save
              size={16}
              className={saveStatus?.saved ? 'save-icon saved' : 'save-icon'}
            />
            {saveStatus?.saved && saveStatus?.time && (
              <span className="save-status-text">
                Документ сохранен в {saveStatus.time.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </div>
        </div>
        <div className="downbar-right">
          {/* Split View */}
          <button
            className={`btn-icon ${splitViewEnabled ? 'active' : ''}`}
            onClick={toggleSplitView}
            title="Split View"
          >
            <Columns2 size={16} />
          </button>

          {/* Режим множественного выбора */}
          <button
            className={`btn-icon ${multiSelectMode ? 'active' : ''}`}
            onClick={toggleMultiSelectMode}
            title="Множественный выбор"
          >
            <Check size={16} />
          </button>

          <button className="btn-icon" onClick={handleCreateDocument} title="Создать документ">
            <Plus size={16} />
          </button>
          <button className="btn-icon" onClick={handleCreateFolder} title="Создать папку">
            <FolderPlus size={16} />
          </button>
          <button className="btn-icon" title="Настройки">
            <Settings size={16} />
          </button>
          <div className="sort-dropdown">
            <button className="btn-icon sort-trigger" title="Сортировка">
              <ArrowUpDown size={16} />
            </button>
            <div className="sort-menu">
              <button onClick={() => setSortBy('alphabetical')}>
                {sortBy === 'alphabetical' && '✓ '}От А до Я
              </button>
              <button onClick={() => setSortBy('newest')}>
                {sortBy === 'newest' && '✓ '}Сначала новые
              </button>
              <button onClick={() => setSortBy('oldest')}>
                {sortBy === 'oldest' && '✓ '}Сначала старые
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
