import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import api from '../services/api';
import CreateSiteModal from '../components/CreateSiteModal';
import IconRenderer from '../components/IconRenderer';
import './SitesPage.css';

function SitesPage() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      const response = await api.get('/sites');
      setSites(response.data.sites);
    } catch (error) {
      console.error('Failed to load sites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSite = async (siteData) => {
    try {
      const response = await api.post('/sites', siteData);
      const newSite = response.data.site;
      setSites(prev => [newSite, ...prev]);
      setShowCreateModal(false);
      navigate(`/sites/${newSite.id}`);
    } catch (error) {
      console.error('Failed to create site:', error);
      throw error;
    }
  };

  if (loading) {
    return <div className="sites-page__loading">Загрузка...</div>;
  }

  return (
    <div className="sites-page">
      <div className="sites-page__header">
        <h1 className="sites-page__title">Сайты</h1>
        <button
          className="sites-page__create-btn"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={20} />
          Новый сайт
        </button>
      </div>

      {sites.length === 0 ? (
        <div className="sites-page__empty">
          <p>Пока нет сайтов</p>
          <button
            className="sites-page__empty-btn"
            onClick={() => setShowCreateModal(true)}
          >
            Создайте первый сайт
          </button>
        </div>
      ) : (
        <div className="sites-page__grid">
          {sites.map(site => (
            <div
              key={site.id}
              className="site-card"
              onClick={() => navigate(`/sites/${site.id}`)}
            >
              <div className="site-card__icon">
                <IconRenderer iconName={site.icon} size={32} />
              </div>
              <h3 className="site-card__name">{site.name}</h3>
              <p className="site-card__date">
                {new Date(site.created_at).toLocaleDateString('ru-RU')}
              </p>
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

export default SitesPage;
