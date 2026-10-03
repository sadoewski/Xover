import { useState } from "react";
import "./CreateItemModal.css";

export default function CreateItemModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    x: "",
    y: "",
    z: ""
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      x: parseFloat(formData.x) || 0,
      y: parseFloat(formData.y) || 0,
      z: parseFloat(formData.z) || 0
    });
    setFormData({ name: "", description: "", x: "", y: "", z: "" });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Добавить элемент</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Название</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Описание</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="coordinates-group">
            <div className="form-group">
              <label>X</label>
              <input
                type="number"
                step="0.01"
                value={formData.x}
                onChange={(e) => setFormData({ ...formData, x: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Y</label>
              <input
                type="number"
                step="0.01"
                value={formData.y}
                onChange={(e) => setFormData({ ...formData, y: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Z</label>
              <input
                type="number"
                step="0.01"
                value={formData.z}
                onChange={(e) => setFormData({ ...formData, z: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Отмена
            </button>
            <button type="submit" className="btn-primary">
              Создать
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
