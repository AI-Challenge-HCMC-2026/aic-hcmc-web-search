import React, { useState } from 'react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export interface SidebarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onLogout?: () => void;
  userName?: string;
  userPlan?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onLogout,
  userName = 'Phú Nguyễn',
  userPlan = 'Free Plan',
}) => {
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [hoveredLogout, setHoveredLogout] = useState(false);
  const [hoveredNewBtn, setHoveredNewBtn] = useState(false);

  const navItems: NavItem[] = [
    {
      id: 'chats',
      label: 'Chats',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      id: 'mcp-tools',
      label: 'MCP Tools',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      ),
    },
    {
      id: 'api-docs',
      label: 'API Documents',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
  ];

  // Recent activity items for the history section
  const recentHistory = [
    'Deploy staging pipeline',
    'MCP search optimization',
    'API rate limit review',
  ];

  return (
    <aside
      style={{
        width: '260px',
        minWidth: '260px',
        height: '100vh',
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}
    >
      {/* ─── Header: Brand (Serif) + Collapse Toggle ─── */}
      <div
        style={{
          padding: '20px 16px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Claude-style sparkle mark */}
          <span style={{ color: 'var(--accent-terracotta)', fontSize: '18px', lineHeight: 1 }}>✻</span>
          <span
            style={{
              fontSize: '16px',
              fontWeight: 500,
              fontFamily: 'var(--font-serif)',
              letterSpacing: '-0.01em',
              color: 'var(--text-primary)',
            }}
          >
            MIBR AI
          </span>
        </div>

        {/* Sidebar Collapse Toggle Icon */}
        <button
          type="button"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-tertiary)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            transition: 'color 0.15s ease',
          }}
          aria-label="Toggle sidebar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
        </button>
      </div>

      {/* ─── + New Chat Pill Button ─── */}
      <div style={{ padding: '4px 12px 12px' }}>
        <button
          type="button"
          onMouseEnter={() => setHoveredNewBtn(true)}
          onMouseLeave={() => setHoveredNewBtn(false)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-default)',
            backgroundColor: hoveredNewBtn ? 'var(--bg-surface-subtle)' : 'transparent',
            color: 'var(--text-secondary)',
            fontSize: '13px',
            fontWeight: 500,
            fontFamily: 'var(--font-sans)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Chat
        </button>
      </div>

      {/* ─── Navigation Links ─── */}
      <nav style={{ padding: '4px 10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const isHovered = hoveredNav === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              onMouseEnter={() => setHoveredNav(item.id)}
              onMouseLeave={() => setHoveredNav(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: isActive
                  ? 'var(--bg-surface-active)'
                  : isHovered
                  ? 'var(--bg-surface-subtle)'
                  : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 500 : 400,
                fontSize: '13.5px',
                fontFamily: 'var(--font-sans)',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: isActive ? 'var(--accent-terracotta)' : 'var(--text-tertiary)',
                  transition: 'color 0.15s ease',
                }}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ─── Recent History Section ─── */}
      <div style={{ padding: '16px 10px 8px', flex: 1, overflow: 'hidden' }}>
        <div style={{
          fontSize: '11px',
          fontWeight: 500,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          padding: '0 12px 8px',
        }}>
          Recent
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {recentHistory.map((item, i) => (
            <button
              key={i}
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '7px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'transparent',
                color: 'var(--text-tertiary)',
                fontSize: '13px',
                fontFamily: 'var(--font-sans)',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              <span style={{ color: 'var(--text-muted)', fontSize: '8px', flexShrink: 0 }}>○</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Footer: Profile Badge & Logout ─── */}
      <div
        style={{
          padding: '12px 14px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
          {/* Avatar */}
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-surface-active)',
              backgroundImage: 'linear-gradient(135deg, var(--bg-surface-elevated) 0%, var(--bg-surface-subtle) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '12px',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              flexShrink: 0,
            }}
          >
            P
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {userName}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {userPlan}
            </span>
          </div>
        </div>

        {/* Logout Action Button */}
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            onMouseEnter={() => setHoveredLogout(true)}
            onMouseLeave={() => setHoveredLogout(false)}
            style={{
              background: hoveredLogout ? 'var(--bg-surface-subtle)' : 'transparent',
              border: 'none',
              color: hoveredLogout ? 'var(--text-secondary)' : 'var(--text-tertiary)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            title="Đăng xuất"
            aria-label="Logout"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
