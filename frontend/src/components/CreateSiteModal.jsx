import { useState } from 'react';
import {
  X, Folder, BarChart3, FileText, Briefcase, Target,
  Wrench, Settings, Package, Home, Globe, Laptop,
  Smartphone, Palette, Microscope, BookOpen, GraduationCap,
  Lightbulb, Rocket, Star, Flame, Gem, Tent, Trophy
} from 'lucide-react';
import './CreateSiteModal.css';

const ICON_OPTIONS = [
  { icon: Folder, name: 'folder' },
  { icon: BarChart3, name: 'chart' },
  { icon: FileText, name: 'document' },
  { icon: Briefcase, name: 'briefcase' },
  { icon: Target, name: 'target' },
  { icon: Wrench, name: 'wrench' },
  { icon: Settings, name: 'settings' },
  { icon: Package, name: 'package' },
  { icon: Home, name: 'home' },
  { icon: Globe, name: 'globe' },
  { icon: Laptop, name: 'laptop' },
  { icon: Smartphone, name: 'smartphone' },
  { icon: Palette, name: 'palette' },
  { icon: Microscope, name: 'microscope' },
  { icon: BookOpen, name: 'book' },
  { icon: GraduationCap, name: 'graduation' },
  { icon: Lightbulb, name: 'lightbulb' },
  { icon: Rocket, name: 'rocket' },
  { icon: Star, name: 'star' },
  { icon: Flame, name: 'flame' },
  { icon: Gem, name: 'gem' },
  { icon: Tent, name: 'tent' },
  { icon: Trophy, name: 'trophy' }
];

function СоздатьSiteModal({ onClose, onСоздать }) {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(ICON_OPTIONS[0].name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Название обязательно');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onСоздать(name.trim(), selectedIcon);
    } catch (err) {
      setError(err.message || 'Не удалось создать сайт');
      setLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="create-site-modal">
        <div className="create-site-modal__header">
          <h2 className="create-site-modal__title">Новый сайт</h2>
          <button
            className="create-site-modal__close"
            onClick={onClose}
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="create-site-modal__error">
              {error}
            </div>
          )}

          <div className="create-site-modal__field">
            <label className="create-site-modal__label">
              Название сайта
            </label>
            <input
              type="text"
              className="create-site-modal__input"
              placeholder="Введите название сайта..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="create-site-modal__field">
            <label className="create-site-modal__label">
              Иконка
            </label>
            <div className="icon-picker">
              {ICON_OPTIONS.map((iconData) => {
                const IconComponent = iconData.icon;
                return (
                  <button
                    key={iconData.name}
                    type="button"
                    className={`icon-picker__item ${
                      selectedIcon === iconData.name ? 'icon-picker__item--selected' : ''
                    }`}
                    onClick={() => setSelectedIcon(iconData.name)}
                    disabled={loading}
                  >
                    <IconComponent size={20} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="create-site-modal__actions">
            <button
              type="button"
              className="create-site-modal__cancel"
              onClick={onClose}
              disabled={loading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="create-site-modal__submit"
              disabled={loading || !name.trim()}
            >
              {loading ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default СоздатьSiteModal;
