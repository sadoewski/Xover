import { useState, useEffect } from 'react';
import './AppearanceSettings.css';

export default function AppearanceSettings() {
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('appFontSize');
    return saved ? parseInt(saved) : 16;
  });

  const [scale, setScale] = useState(() => {
    const saved = localStorage.getItem('appScale');
    return saved ? parseInt(saved) : 100;
  });

  useEffect(() => {
    // Устанавливаем базовый размер шрифта для всего приложения
    document.documentElement.style.fontSize = `${fontSize}px`;
    localStorage.setItem('appFontSize', fontSize);
  }, [fontSize]);

  useEffect(() => {
    // Применяем масштаб через CSS переменную
    const scaleValue = scale / 100;
    document.documentElement.style.setProperty('--app-scale', scaleValue);
    localStorage.setItem('appScale', scale);
  }, [scale]);

  return (
    <div className="appearance-settings">
      <h2>Внешний вид</h2>

      <div className="setting-section">
        <label className="setting-label">
          Размер шрифта
          <span className="setting-value">{fontSize}px</span>
        </label>
        <input
          type="range"
          min="12"
          max="24"
          step="1"
          value={fontSize}
          onChange={(e) => setFontSize(parseInt(e.target.value))}
          className="setting-slider"
        />
        <div className="slider-markers">
          <span>Маленький (12px)</span>
          <span>Средний (16px)</span>
          <span>Большой (24px)</span>
        </div>
      </div>

      <div className="setting-section">
        <label className="setting-label">
          Масштаб интерфейса
          <span className="setting-value">{scale}%</span>
        </label>
        <input
          type="range"
          min="75"
          max="150"
          step="5"
          value={scale}
          onChange={(e) => setScale(parseInt(e.target.value))}
          className="setting-slider"
        />
        <div className="slider-markers">
          <span>75%</span>
          <span>100%</span>
          <span>150%</span>
        </div>
        <div className="scale-buttons">
          <button
            className={`scale-btn ${scale === 90 ? 'active' : ''}`}
            onClick={() => setScale(90)}
          >
            90%
          </button>
          <button
            className={`scale-btn ${scale === 100 ? 'active' : ''}`}
            onClick={() => setScale(100)}
          >
            100%
          </button>
          <button
            className={`scale-btn ${scale === 125 ? 'active' : ''}`}
            onClick={() => setScale(125)}
          >
            125%
          </button>
        </div>
      </div>

      <div className="preview-section">
        <h3>Предпросмотр</h3>
        <div className="preview-text">
          <p>Заголовок документа</p>
          <p className="small">Обычный текст с текущими настройками шрифта и масштаба</p>
          <p className="small">Попробуйте изменить параметры выше, чтобы увидеть эффект</p>
        </div>
      </div>

      <div className="setting-notice">
        <p><strong>Примечание:</strong> Изменение размера шрифта влияет на текст во всём приложении.
        Масштаб изменяет размер всех элементов интерфейса.</p>
      </div>
    </div>
  );
}
