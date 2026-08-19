import { useState, useEffect } from 'react';
import LoginPage from './pages/login';
import { DashboardLayout } from './components/layout/DashboardLayout';
import SettingsPage from './pages/dashboard/settings';
import ChatsPage from './pages/dashboard/chats';
import McpToolsPage from './pages/dashboard/mcp-tools';
import ApiDocsPage from './pages/dashboard/api-docs';

type AppRoute = 'login' | 'dashboard';
type DashboardTab = 'chats' | 'mcp-tools' | 'api-docs' | 'settings';

function App() {
  // Parse initial route and tab from window.location.hash
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => {
    if (window.location.hash.startsWith('#/dashboard')) {
      return 'dashboard';
    }
    return 'dashboard'; // Default to authenticated dashboard for direct preview
  });

  const [activeTab, setActiveTab] = useState<DashboardTab>(() => {
    const hash = window.location.hash;
    if (hash === '#/dashboard/chats') return 'chats';
    if (hash === '#/dashboard/mcp-tools') return 'mcp-tools';
    if (hash === '#/dashboard/api-docs') return 'api-docs';
    return 'settings'; // Default to settings as shown in reference UI
  });

  // Sync state when browser back/forward or hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/dashboard')) {
        setCurrentRoute('dashboard');
        if (hash === '#/dashboard/chats') setActiveTab('chats');
        else if (hash === '#/dashboard/mcp-tools') setActiveTab('mcp-tools');
        else if (hash === '#/dashboard/api-docs') setActiveTab('api-docs');
        else setActiveTab('settings');
      } else if (hash === '#/login') {
        setCurrentRoute('login');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectTab = (tabId: string) => {
    const tab = tabId as DashboardTab;
    setActiveTab(tab);
    window.location.hash = `#/dashboard/${tab}`;
  };

  const handleLoginSuccess = () => {
    setCurrentRoute('dashboard');
    setActiveTab('settings');
    window.location.hash = '#/dashboard/settings';
  };

  const handleLogout = () => {
    setCurrentRoute('login');
    window.location.hash = '#/login';
  };

  // Render Login Page View
  if (currentRoute === 'login') {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Render Authenticated Dashboard Layout
  return (
    <DashboardLayout
      activeTab={activeTab}
      onSelectTab={handleSelectTab}
      onLogout={handleLogout}
      userName="Phú Nguyễn"
      userPlan="Free Plan"
    >
      {activeTab === 'settings' && <SettingsPage />}
      {activeTab === 'chats' && <ChatsPage />}
      {activeTab === 'mcp-tools' && <McpToolsPage />}
      {activeTab === 'api-docs' && <ApiDocsPage />}
    </DashboardLayout>
  );
}

export default App;
