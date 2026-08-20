import { useState, useEffect } from 'react';
import LoginPage from './pages/login';
import { DashboardLayout } from './components/layout/DashboardLayout';
import SettingsPage from './pages/dashboard/settings';
import ChatsPage from './pages/dashboard/chats';
import McpToolsPage from './pages/dashboard/mcp-tools';
import ApiDocsPage from './pages/dashboard/api-docs';
import DatasetPage from './pages/dashboard/dataset';

type AppRoute = 'login' | 'dashboard';
type DashboardTab = 'chats' | 'mcp-tools' | 'api-docs' | 'settings' | 'dataset';

const dashboardTabs: DashboardTab[] = ['chats', 'mcp-tools', 'api-docs', 'settings', 'dataset'];

const isDashboardTab = (value: string): value is DashboardTab => dashboardTabs.includes(value as DashboardTab);

const getDashboardTab = (hash: string): DashboardTab => {
  const match = hash.match(/^#\/dashboard\/([^/?#]+)/);
  const tab = match?.[1];
  return tab && isDashboardTab(tab) ? tab : 'settings';
};

function App() {
  // Parse initial route and tab from window.location.hash
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => {
    if (window.location.hash.startsWith('#/dashboard')) {
      return 'dashboard';
    }
    return 'dashboard'; // Default to authenticated dashboard for direct preview
  });

  const [activeTab, setActiveTab] = useState<DashboardTab>(() => {
    return getDashboardTab(window.location.hash);
  });

  // Sync state when browser back/forward or hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/dashboard')) {
        setCurrentRoute('dashboard');
        setActiveTab(getDashboardTab(hash));
      } else if (hash === '#/login') {
        setCurrentRoute('login');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  const handleSelectTab = (tabId: string) => {
    if (!isDashboardTab(tabId)) return;

    const nextHash = `#/dashboard/${tabId}`;
    setActiveTab(tabId);
    if (window.location.hash !== nextHash) {
      window.history.pushState(null, '', nextHash);
    }
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
      {activeTab === 'dataset' && <DatasetPage />}
    </DashboardLayout>
  );
}

export default App;
