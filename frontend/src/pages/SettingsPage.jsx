import { useState } from 'react';
import { IconEye, IconUsers } from '@tabler/icons-react';
import ProfessionalLayout from '../components/ProfessionalLayout';
import AppearanceSettings from '../components/Settings/AppearanceSettings';
import IconUsersSettings from '../components/Settings/UsersSettings';
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
              <IconEye size={18} />
              <span>Внешний вид</span>
            </button>
            <button
              className={`settings-nav-item ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <IconUsers size={18} />
              <span>Пользователи</span>
            </button>
          </nav>
        </div>

        <div className="settings-content">
          {activeTab === 'appearance' && <AppearanceSettings />}
          {activeTab === 'users' && <IconUsersSettings />}
        </div>
      </div>
    </ProfessionalLayout>
  );
}
