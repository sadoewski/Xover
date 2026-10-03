import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Grid3x3, Trash2 } from 'lucide-react';
import { sitesService } from '../services/sites';
import CreateItemModal from './CreateItemModal';
import SiteWidget from './SiteWidget';
import './SitePage.css';

function SitePage() {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const [site, setSite] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);

  useEffect(() => {
    loadSite();
  }, [siteId]);

  const loadSite = async () => {
    try {
      const data = await sitesService.getSite(siteId);
      setSite(data.site);
      setItems(data.items || []);
      updateBreadcrumbs(null);
    } catch (error) {
      console.error('Ошибка загрузки сайта:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBreadcrumbs = (folderId) => {
    if (!folderId) {
      setBreadcrumbs([]);
      return;
    }

    const crumbs = [];
    let current = folderId;

    while (current) {
      const folder = items.find(item => item.id === current);
      if (folder) {
        crumbs.unshift({ id: folder.id, name: folder.name });
        current = folder.parent_id;
      } else {
        break;
      }
    }

    setBreadcrumbs(crumbs);
  };

  const handleCreateItem = async (itemData) => {
    try {
      await sitesService.createItem(siteId, {
        ...itemData,
        parent_id: currentFolder
      });
      loadSite();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Ошибка создания элемента:', error);
      throw error;
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Удалить этот элемент?')) return;

    try {
      await sitesService.deleteItem(siteId, itemId);
      loadSite();
    } catch (error) {
      console.error('Ошибка удаления элемента:', error);
      alert('Ошибка удаления элемента');
    }
  };

  const handleUpdateItem = async (itemId, updates) => {
    try {
      await sitesService.updateItem(siteId, itemId, updates);
      loadSite();
    } catch (error) {
      console.error('Ошибка обновления элемента:', error);
    }
  };

  const handleOpenFolder = (folderId) => {
    setCurrentFolder(folderId);
    updateBreadcrumbs(folderId);
  };

  const handleBreadcrumbClick = (folderId) => {
    setCurrentFolder(folderId);
    updateBreadcrumbs(folderId);
  };

  const getCurrentItems = () => {
    return items.filter(item => item.parent_id === currentFolder);
  };

  const filteredItems = getCurrentItems().filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="site-page-loading">Loading...</div>;
  }

  if (!site) {
    return <div className="site-page-error">Site not found</div>;
  }

  return (
    <div className="site-page">
      <div className="site-page__header">
        <div className="site-page__header-left">
          <button
            className="site-page__back"
            onClick={() => navigate('/rwprint')}
          >
            <ArrowLeft size={20} />
          </button>
          <div className="site-page__icon">{site.icon}</div>
          <h1 className="site-page__title">{site.name}</h1>
        </div>

        <div className="site-page__header-right">
          <div className="search-box-compact">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input-compact"
            />
          </div>

          <button
            className={`edit-mode-btn ${editMode ? 'active' : ''}`}
            onClick={() => setEditMode(!editMode)}
            title="Toggle edit mode"
          >
            <Grid3x3 size={16} />
          </button>

          <button
            className="create-item-btn"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={16} />
            New
          </button>
        </div>
      </div>

      {breadcrumbs.length > 0 && (
        <div className="site-page__breadcrumbs">
          <button
            className="breadcrumb"
            onClick={() => handleBreadcrumbClick(null)}
          >
            {site.icon} {site.name}
          </button>
          {breadcrumbs.map((crumb) => (
            <span key={crumb.id}>
              <span className="breadcrumb-sep">/</span>
              <button
                className="breadcrumb"
                onClick={() => handleBreadcrumbClick(crumb.id)}
              >
                {crumb.name}
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="site-page__content">
        {filteredItems.length === 0 ? (
          <div className="site-page__empty">
            <p>No items yet</p>
            <button
              className="create-first-item-btn"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={20} />
              Create first item
            </button>
          </div>
        ) : (
          <div className="site-widgets-grid">
            {filteredItems.map((item) => (
              <SiteWidget
                key={item.id}
                item={item}
                editMode={editMode}
                onUpdate={(updates) => handleUpdateItem(item.id, updates)}
                onDelete={() => handleDeleteItem(item.id)}
                onOpenFolder={() => handleOpenFolder(item.id)}
              />
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateItemModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateItem}
          currentFolder={currentFolder}
        />
      )}
    </div>
  );
}

export default SitePage;
