import { useState } from 'react';
import { X, Folder, Table, FileText, StickyNote } from 'lucide-react';
import './CreateItemModal.css';

const ITEM_TYPES = [
  { id: 'folder', label: 'Folder', icon: Folder, description: 'Organize items' },
  { id: 'database', label: 'Database', icon: Table, description: 'Table with rows & columns' },
  { id: 'textboard', label: 'Textboard', icon: StickyNote, description: 'Quick notes' },
  { id: 'document', label: 'Document', icon: FileText, description: 'Text document' }
];

function CreateItemModal({ onClose, onCreate, currentFolder }) {
  const [step, setStep] = useState(1); // 1 - select type, 2 - configure
  const [selectedType, setSelectedType] = useState(null);
  const [name, setName] = useState('');
  const [dbConfig, setDbConfig] = useState({ columns: 3, rows: 1 });
  const [columnNames, setColumnNames] = useState(['Column 1', 'Column 2', 'Column 3']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setStep(2);

    // Reset configuration
    setName('');
    setError('');

    if (type === 'database') {
      setDbConfig({ columns: 3, rows: 1 });
      setColumnNames(['Column 1', 'Column 2', 'Column 3']);
    }
  };

  const handleColumnCountChange = (count) => {
    const newCount = Math.max(1, Math.min(10, count));
    setDbConfig({ ...dbConfig, columns: newCount });

    const newNames = [];
    for (let i = 0; i < newCount; i++) {
      newNames.push(columnNames[i] || `Column ${i + 1}`);
    }
    setColumnNames(newNames);
  };

  const handleColumnNameChange = (index, value) => {
    const newNames = [...columnNames];
    newNames[index] = value;
    setColumnNames(newNames);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let itemData = {
        type: selectedType,
        name: name.trim()
      };

      if (selectedType === 'database') {
        const rows = Array(dbConfig.rows).fill(null).map(() =>
          Array(dbConfig.columns).fill('')
        );

        itemData.data = JSON.stringify({
          columns: columnNames.slice(0, dbConfig.columns),
          rows
        });
      } else if (selectedType === 'textboard') {
        itemData.data = JSON.stringify({ content: '' });
      }

      await onCreate(itemData);
    } catch (err) {
      setError(err.message || 'Failed to create item');
      setLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setSelectedType(null);
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="create-item-modal">
        <div className="create-item-modal__header">
          <h2 className="create-item-modal__title">
            {step === 1 ? 'New Item' : `New ${selectedType}`}
          </h2>
          <button
            className="create-item-modal__close"
            onClick={onClose}
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        {step === 1 ? (
          <div className="item-type-selector">
            {ITEM_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  className="item-type-card"
                  onClick={() => handleTypeSelect(type.id)}
                >
                  <Icon size={32} />
                  <h3>{type.label}</h3>
                  <p>{type.description}</p>
                </button>
              );
            })}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="create-item-modal__error">
                {error}
              </div>
            )}

            <div className="create-item-modal__field">
              <label className="create-item-modal__label">
                Name
              </label>
              <input
                type="text"
                className="create-item-modal__input"
                placeholder={`Enter ${selectedType} name...`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>

            {selectedType === 'database' && (
              <>
                <div className="create-item-modal__field">
                  <label className="create-item-modal__label">
                    Number of Columns
                  </label>
                  <input
                    type="number"
                    className="create-item-modal__input"
                    min="1"
                    max="10"
                    value={dbConfig.columns}
                    onChange={(e) => handleColumnCountChange(parseInt(e.target.value) || 1)}
                    disabled={loading}
                  />
                </div>

                <div className="create-item-modal__field">
                  <label className="create-item-modal__label">
                    Column Names
                  </label>
                  <div className="column-names-grid">
                    {columnNames.slice(0, dbConfig.columns).map((name, index) => (
                      <input
                        key={index}
                        type="text"
                        className="create-item-modal__input"
                        placeholder={`Column ${index + 1}`}
                        value={name}
                        onChange={(e) => handleColumnNameChange(index, e.target.value)}
                        disabled={loading}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="create-item-modal__actions">
              <button
                type="button"
                className="create-item-modal__cancel"
                onClick={handleBack}
                disabled={loading}
              >
                Back
              </button>
              <button
                type="submit"
                className="create-item-modal__submit"
                disabled={loading || !name.trim()}
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default CreateItemModal;
