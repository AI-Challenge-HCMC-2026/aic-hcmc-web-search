import React from 'react';
import { Sidebar } from './Sidebar';

export interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onLogout?: () => void;
  userName?: string;
  userPlan?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  activeTab,
  onSelectTab,
  onLogout,
  userName,
  userPlan,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-primary)',
        overflow: 'hidden',
      }}
    >
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        onLogout={onLogout}
        userName={userName}
        userPlan={userPlan}
      />

      {/* Main Content Area */}
      <main
        style={{
          flex: 1,
          height: '100vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          backgroundColor: 'var(--bg-app)',
          position: 'relative',
        }}
      >
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
