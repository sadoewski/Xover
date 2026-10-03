import { useState } from 'react';
import { Eye, FolderTree, Users } from 'lucide-react';
import ProfessionalLayout from '../components/ProfessionalLayout';
import AppearanceSettings from '../components/Settings/AppearanceSettings';
import FilesSettings from '../components/Settings/FilesSettings';
import UsersSettings from '../components/Settings/UsersSettings';
import './SettingsPage.css';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('appearance');

  return (
    <ProfessionalLayout>
      <div className="settings-container">
        <div className="settings-sidebar">
          <h2>Настройки</h2>
          <nav className="settings-nav">
            <button
              className={`settings-nav-item ${activeTab === 'appearance' ? 'active' : ''}`}
              onClick={() => setActiveTab('appearance')}
            >
              <Eye size={18} />
              <span>Внешний вид</span>
            </button>
            <button
              className={`settings-nav-item ${activeTab === 'files' ? 'active' : ''}`}
              onClick={() => setActiveTab('files')}
            >
              <FolderTree size={18} />
              <span>Файлы</span>
            </button>
            <button
              className={`settings-nav-item ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <Users size={18} />
              <span>Пользователи</span>
            </button>
          </nav>
        </div>

        <div className="settings-content">
          {activeTab === 'appearance' && <AppearanceSettings />}
          {activeTab === 'files' && <FilesSettings />}
          {activeTab === 'users' && <UsersSettings />}
        </div>
      </div>
    </ProfessionalLayout>
  );
}
