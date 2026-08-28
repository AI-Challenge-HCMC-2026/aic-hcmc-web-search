import React from 'react';

export interface SubmissionPlaceholderPageProps {
  title: string;
  description?: string;
}

export const SubmissionPlaceholderPage: React.FC<SubmissionPlaceholderPageProps> = ({
  title,
  description,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100%',
        width: '100%',
        padding: '40px 24px',
        boxSizing: 'border-box',
        animation: 'fadeIn 0.3s ease',
      }}
    >
      <div
        style={{
          maxWidth: '520px',
          width: '100%',
          backgroundColor: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-card)',
          padding: '36px 32px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
        }}
      >
        {/* Sparkle badge with terracotta accent */}
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--accent-terracotta-subtle)',
            border: '1px solid rgba(218, 119, 86, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-terracotta)',
            fontSize: '28px',
            lineHeight: 1,
          }}
          aria-hidden="true"
        >
          ✻
        </div>

        {/* Status Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--bg-surface-subtle)',
            border: '1px solid var(--border-default)',
            fontSize: '12px',
            fontWeight: 500,
            color: 'var(--text-tertiary)',
            fontFamily: 'var(--font-sans)',
            letterSpacing: '0.02em',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-terracotta)',
              display: 'inline-block',
            }}
          />
          Tính năng đang được phát triển
        </div>

        {/* Title & Description */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '24px',
              fontWeight: 500,
              color: 'var(--text-primary)',
              letterSpacing: '-0.015em',
              margin: 0,
            }}
          >
            {title}
          </h1>
          {description && (
            <p
              style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                margin: 0,
                fontFamily: 'var(--font-sans)',
              }}
            >
              {description}
            </p>
          )}
        </div>

        {/* Additional Context Card */}
        <div
          style={{
            width: '100%',
            backgroundColor: 'var(--bg-surface-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px',
            textAlign: 'left',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            Thông tin hệ thống
          </div>
          <p
            style={{
              fontSize: '12.5px',
              color: 'var(--text-muted)',
              lineHeight: 1.5,
              margin: 0,
              fontFamily: 'var(--font-sans)',
            }}
          >
            Mô-đun đánh giá tự động và submission API đang được hoàn thiện. Vui lòng quay lại sau khi bản cập nhật tiếp theo được phát hành.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubmissionPlaceholderPage;
