import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Search } from 'lucide-react';
import { sitesService } from '../services/sites';
import CreateSiteModal from './CreateSiteModal';
import './SitesList.css';

function SitesList() {
  const navigate = useNavigate();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      const data = await sitesService.getSites();
      setSites(data.sites);
    } catch (error) {
      console.error('Ошибка загрузки сайтов:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSite = async (name, icon) => {
    try {
      await sitesService.createSite(name, icon);
      loadSites();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Ошибка создания сайта:', error);
      throw error;
    }
  };

  const handleDeleteSite = async (siteId, e) => {
    e.stopPropagation();
    if (!window.confirm('Удалить сайт и все его содержимое?')) return;

    try {
      await sitesService.deleteSite(siteId);
      loadSites();
    } catch (error) {
      console.error('Ошибка удаления сайта:', error);
      alert('Ошибка удаления сайта');
    }
  };

  const handleOpenSite = (siteId) => {
    navigate(`/sites/${siteId}`);
  };

  const filteredSites = sites.filter(site =>
    site.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="sites-list-loading">Loading...</div>;
  }

  return (
    <div className="sites-list-container">
      <div className="sites-list-header">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search sites..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <button
          className="create-site-btn"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={16} />
          New Site
        </button>
      </div>

      {filteredSites.length === 0 ? (
        <div className="sites-list-empty">
          <p>No sites yet</p>
          <button
            className="create-first-site-btn"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={20} />
            Create your first site
          </button>
        </div>
      ) : (
        <div className="sites-grid">
          {filteredSites.map(site => (
            <div
              key={site.id}
              className="site-card"
              onClick={() => handleOpenSite(site.id)}
            >
              <div className="site-card__icon">{site.icon}</div>
              <div className="site-card__content">
                <h3 className="site-card__name">{site.name}</h3>
                <p className="site-card__date">
                  Created {new Date(site.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <button
                className="site-card__delete"
                onClick={(e) => handleDeleteSite(site.id, e)}
                title="Delete site"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateSiteModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateSite}
        />
      )}
    </div>
  );
}

export default SitesList;
