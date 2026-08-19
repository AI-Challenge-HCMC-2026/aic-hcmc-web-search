import React from 'react';
import { Button } from '../../../components/ui/Button';

interface ToolCardProps {
  name: string;
  category: string;
  description: string;
  status: 'active' | 'idle';
  server: string;
}

export const McpToolsPage: React.FC = () => {
  const tools: ToolCardProps[] = [
    {
      name: 'web_search',
      category: 'Research',
      description: 'Tìm kiếm web thời gian thực và trích xuất dữ liệu tổng hợp.',
      status: 'active',
      server: 'brave-search-mcp',
    },
    {
      name: 'internal_db_query',
      category: 'Database',
      description: 'Truy vấn cơ sở dữ liệu nội bộ MIBR phục vụ tra cứu nhanh.',
      status: 'active',
      server: 'postgres-internal',
    },
    {
      name: 'git_codebase_search',
      category: 'Developer',
      description: 'Tìm kiếm pattern, semantic symbol và xem diff code.',
      status: 'idle',
      server: 'git-tools-server',
    },
  ];

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', padding: '44px 28px 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--accent-terracotta)', fontSize: '20px' }}>✻</span>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.015em' }}>
              MCP Tools
            </h1>
          </div>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Quản lý và giám sát các công cụ Model Context Protocol được tích hợp.
          </p>
        </div>
        <Button variant="primary" size="sm">
          + Thêm MCP Server
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '18px' }}>
        {tools.map((tool) => (
          <div
            key={tool.name}
            style={{
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              padding: '20px 22px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px',
              boxShadow: 'var(--shadow-card)',
              transition: 'border-color 0.2s ease, transform 0.2s ease',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {tool.name}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: tool.status === 'active' ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-surface-active)',
                    color: tool.status === 'active' ? 'var(--success)' : 'var(--text-tertiary)',
                    fontWeight: 500,
                    border: '1px solid',
                    borderColor: tool.status === 'active' ? 'rgba(16, 185, 129, 0.25)' : 'var(--border-subtle)',
                  }}
                >
                  {tool.status === 'active' ? '● Hoạt động' : '○ Sẵn sàng'}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {tool.description}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                {tool.server}
              </span>
              <Button variant="ghost" size="sm">
                Cấu hình
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default McpToolsPage;
