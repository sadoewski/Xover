import { useState } from 'react';
import { X } from 'lucide-react';
import './CreateSiteModal.css';

const ICON_OPTIONS = [
  '📁', '📊', '📝', '💼', '🎯', '🔧', '⚙️', '📦',
  '🏠', '🌐', '💻', '📱', '🎨', '🔬', '📚', '🎓',
  '💡', '🚀', '⭐', '🔥', '💎', '🎪', '🏆', '🎯'
];

function CreateSiteModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(ICON_OPTIONS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onCreate(name.trim(), selectedIcon);
    } catch (err) {
      setError(err.message || 'Failed to create site');
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
          <h2 className="create-site-modal__title">New Site</h2>
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
              Site Name
            </label>
            <input
              type="text"
              className="create-site-modal__input"
              placeholder="Enter site name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="create-site-modal__field">
            <label className="create-site-modal__label">
              Icon
            </label>
            <div className="icon-picker">
              {ICON_OPTIONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  className={`icon-picker__item ${
                    selectedIcon === icon ? 'icon-picker__item--selected' : ''
                  }`}
                  onClick={() => setSelectedIcon(icon)}
                  disabled={loading}
                >
                  <span className="icon-picker__emoji">{icon}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="create-site-modal__actions">
            <button
              type="button"
              className="create-site-modal__cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="create-site-modal__submit"
              disabled={loading || !name.trim()}
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateSiteModal;
