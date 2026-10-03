import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/theme.css'
import App from './App.jsx'

// Загружаем сохранённые настройки внешнего вида
const loadAppearanceSettings = () => {
  const savedFontSize = localStorage.getItem('appFontSize');
  const savedScale = localStorage.getItem('appScale');

  if (savedFontSize) {
    document.documentElement.style.fontSize = `${savedFontSize}px`;
  }

  if (savedScale) {
    const scaleValue = parseInt(savedScale) / 100;
    document.documentElement.style.setProperty('--app-scale', scaleValue);
  }
};

// Применяем настройки до рендера приложения
loadAppearanceSettings();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
