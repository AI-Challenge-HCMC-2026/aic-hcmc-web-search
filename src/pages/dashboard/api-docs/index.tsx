import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';

export const ApiDocsPage: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const curlCode = `curl -X POST https://api.mibr.internal/v1/chat/completions \\
  -H "Authorization: Bearer $MIBR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gemini-3.1-flash-lite",
    "messages": [{"role": "user", "content": "Analyze system logs"}],
    "enable_reasoning": true,
    "enable_mcp": true
  }'`;

  const handleCopy = () => {
    navigator.clipboard.writeText(curlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', padding: '44px 28px 80px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--accent-terracotta)', fontSize: '20px' }}>✻</span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.015em' }}>
            API Documents
          </h1>
        </div>
        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Tài liệu đặc tả API và hướng dẫn tích hợp MIBR Gateway.
        </p>
      </header>

      {/* Code Example Card */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface-subtle)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          padding: '24px 26px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)' }}>
            Khởi tạo client (cURL / Python)
          </h2>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? '✓ Đã sao chép' : 'Sao chép mã'}
          </Button>
        </div>

        <pre
          style={{
            backgroundColor: 'var(--bg-sidebar)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px',
            color: 'var(--text-primary)',
            fontSize: '13px',
            fontFamily: 'var(--font-mono)',
            overflowX: 'auto',
            lineHeight: 1.55,
          }}
        >
{curlCode}
        </pre>
      </div>

      {/* Endpoints Table Card */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface-subtle)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          padding: '24px 26px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)' }}>
          Danh sách Endpoint chính
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>POST</span>
            <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>/v1/chat/completions</span>
            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginLeft: 'auto' }}>Gửi prompt và nhận streaming response</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', borderRadius: '4px', border: '1px solid rgba(59, 130, 246, 0.25)' }}>GET</span>
            <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>/v1/mcp/tools</span>
            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginLeft: 'auto' }}>Liệt kê danh sách MCP tools khả dụng</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiDocsPage;
