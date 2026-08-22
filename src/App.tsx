import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/login';
import { DashboardLayout } from './components/layout/DashboardLayout';
import SettingsPage from './pages/dashboard/settings';
import ChatsPage from './pages/dashboard/chats';
import McpToolsPage from './pages/dashboard/mcp-tools';
import ApiDocsPage from './pages/dashboard/api-docs';
import DatasetPage from './pages/dashboard/dataset';
import VectorSearchPage from './pages/dashboard/vector-search';
import KisSearchPage from './pages/dashboard/kis-search';
import ObjectsSearchPage from './pages/dashboard/objects-search';
import FulltextSearchPage from './pages/dashboard/fulltext-search';

type DashboardTab =
  | 'chats'
  | 'mcp-tools'
  | 'api-docs'
  | 'settings'
  | 'dataset'
  | 'vector-search'
  | 'kis-search'
  | 'objects-search'
  | 'fulltext-search';

const dashboardTabs: DashboardTab[] = [
  'chats',
  'mcp-tools',
  'api-docs',
  'settings',
  'dataset',
  'vector-search',
  'kis-search',
  'objects-search',
  'fulltext-search',
];

const isDashboardTab = (value: string): value is DashboardTab =>
  dashboardTabs.includes(value as DashboardTab);

const getDashboardTab = (hash: string): DashboardTab => {
  const match = hash.match(/^#\/dashboard\/([^/?#]+)/);
  const tab = match?.[1];
  return tab && isDashboardTab(tab) ? tab : 'settings';
};

const AppContent: React.FC = () => {
  const { user, loading, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState<DashboardTab>(() => {
    return getDashboardTab(window.location.hash);
  });

  // Sync tab state when hash changes in authenticated mode
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/dashboard')) {
        setActiveTab(getDashboardTab(hash));
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  // Ensure unauthenticated users are kept on login route
  useEffect(() => {
    if (!loading && !user) {
      if (window.location.hash !== '#/login' && window.location.hash !== '') {
        window.history.replaceState(null, '', '#/login');
      }
    } else if (!loading && user) {
      // If user is authenticated and currently on login hash or empty, route to default dashboard tab
      if (window.location.hash === '#/login' || window.location.hash === '' || window.location.hash === '#/') {
        window.history.replaceState(null, '', `#/dashboard/${activeTab}`);
      }
    }
  }, [loading, user, activeTab]);

  const handleSelectTab = (tabId: string) => {
    if (!isDashboardTab(tabId)) return;

    const nextHash = `#/dashboard/${tabId}`;
    setActiveTab(tabId);
    if (window.location.hash !== nextHash) {
      window.history.pushState(null, '', nextHash);
    }
  };

  const handleLoginSuccess = () => {
    setActiveTab('settings');
    window.location.hash = '#/dashboard/settings';
  };

  const handleLogout = async () => {
    await signOut();
    window.location.hash = '#/login';
  };

  // Loading state with Claude design tokens
  if (loading) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          backgroundColor: 'var(--bg-app)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        <span
          style={{
            color: 'var(--accent-terracotta)',
            fontSize: '32px',
            lineHeight: 1,
            animation: 'fadeIn 0.6s ease',
          }}
        >
          ✻
        </span>
        <div
          style={{
            width: '28px',
            height: '28px',
            border: '2px solid rgba(255, 255, 255, 0.1)',
            borderTopColor: 'var(--accent-terracotta)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
          Đang khởi tạo phiên làm việc...
        </p>
      </div>
    );
  }

  // 1. Default & Unauthenticated View: Render Login Page First
  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // 2. Extract User Details from Supabase Auth User Metadata
  const userMetadata = user.user_metadata || {};
  const userName =
    userMetadata.full_name ||
    userMetadata.name ||
    user.email?.split('@')[0] ||
    'User';
  const userEmail = user.email || '';
  const userAvatar = userMetadata.avatar_url || userMetadata.picture || undefined;

  // 3. Render Authenticated Dashboard Layout
  return (
    <DashboardLayout
      activeTab={activeTab}
      onSelectTab={handleSelectTab}
      onLogout={handleLogout}
      userName={userName}
      userEmail={userEmail}
      userAvatar={userAvatar}
      userPlan="Free Plan"
    >
      {activeTab === 'settings' && <SettingsPage />}
      {activeTab === 'chats' && <ChatsPage />}
      {activeTab === 'mcp-tools' && <McpToolsPage />}
      {activeTab === 'api-docs' && <ApiDocsPage />}
      {activeTab === 'dataset' && <DatasetPage />}
      {activeTab === 'vector-search' && <VectorSearchPage />}
      {activeTab === 'kis-search' && <KisSearchPage />}
      {activeTab === 'objects-search' && <ObjectsSearchPage />}
      {activeTab === 'fulltext-search' && <FulltextSearchPage />}
    </DashboardLayout>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
