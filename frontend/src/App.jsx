import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CalendarPageNew from './pages/CalendarPageNew';
import CreateTaskPage from './pages/CreateTaskPage';
import HostboardPage from './pages/HostboardPage';
import TaskDetailPage from './pages/TaskDetailPage';
import GroupsPage from './pages/GroupsPage';
import PrioritiesPage from './pages/PrioritiesPage';
import TemplatesPage from './pages/TemplatesPage';
import EventsPage from './pages/EventsPage';
import SettingsPage from './pages/SettingsPage';
import RWPrintPage from './pages/RWPrintPage';
import DataTasksPage from './pages/DataTasksPage';
import CreateDataTaskPage from './pages/CreateDataTaskPage';
import DataTaskDetailPage from './pages/DataTaskDetailPage';
import SitePage from './pages/SitePage';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <CalendarPageNew />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks/create"
            element={
              <ProtectedRoute>
                <CreateTaskPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks/:id"
            element={
              <ProtectedRoute>
                <TaskDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups"
            element={
              <ProtectedRoute>
                <GroupsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/priorities"
            element={
              <ProtectedRoute>
                <PrioritiesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/templates"
            element={
              <ProtectedRoute>
                <TemplatesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <EventsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/datatasks"
            element={
              <ProtectedRoute>
                <DataTasksPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/datatasks/create"
            element={
              <ProtectedRoute>
                <CreateDataTaskPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/datatasks/:id"
            element={
              <ProtectedRoute>
                <DataTaskDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rwprint"
            element={
              <ProtectedRoute>
                <RWPrintPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sites/:id"
            element={
              <ProtectedRoute>
                <SitePage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
    </Router>
  );
}

export default App;
