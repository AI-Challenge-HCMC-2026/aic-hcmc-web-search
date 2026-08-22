import React, { useState } from 'react';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  helperText?: React.ReactNode;
  statusBadge?: React.ReactNode;
  error?: string;
  isPasswordToggleable?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  statusBadge,
  error,
  type = 'text',
  isPasswordToggleable = false,
  className = '',
  disabled,
  style,
  id,
  onFocus,
  onBlur,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isHoveredToggle, setIsHoveredToggle] = useState(false);
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const effectiveType = isPasswordToggleable
    ? showPassword
      ? 'text'
      : 'password'
    : type;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', ...style }}>
      {/* Header: Label + Status / Helper */}
      {(label || statusBadge) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {label && (
            <label
              htmlFor={inputId}
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {label}
            </label>
          )}
          {statusBadge && (
            <span style={{ fontSize: '12px', color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {statusBadge}
            </span>
          )}
        </div>
      )}

      {/* Input Field Container */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <input
          id={inputId}
          type={effectiveType}
          disabled={disabled}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          style={{
            width: '100%',
            height: '42px',
            backgroundColor: 'var(--bg-surface-subtle)',
            border: error
              ? '1px solid var(--error)'
              : isFocused
              ? '1px solid var(--border-focus)'
              : '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md, 12px)',
            padding: isPasswordToggleable ? '0 38px 0 14px' : '0 14px',
            color: 'var(--text-primary)',
            fontSize: '13.5px',
            fontFamily: 'var(--font-sans)',
            outline: 'none',
            boxShadow: isFocused ? '0 0 0 3px var(--accent-terracotta-subtle)' : 'none',
            transition: 'border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease',
            opacity: disabled ? 0.6 : 1,
            cursor: disabled ? 'not-allowed' : 'text',
          }}
          className={`ui-input ${className}`}
          {...props}
        />

        {/* Minimalist Claude-Style Password Visibility Toggle Button */}
        {isPasswordToggleable && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            onMouseEnter={() => setIsHoveredToggle(true)}
            onMouseLeave={() => setIsHoveredToggle(false)}
            disabled={disabled}
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '28px',
              height: '28px',
              padding: 0,
              backgroundColor: isHoveredToggle ? 'rgba(255, 255, 255, 0.07)' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: isHoveredToggle ? 'var(--text-primary)' : 'var(--text-tertiary)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              userSelect: 'none',
              transition: 'background-color 0.15s ease, color 0.15s ease',
              outline: 'none',
            }}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {showPassword ? (
              /* Eye-Off Icon (When password is visible, clicking will hide) */
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                <line x1="2" x2="22" y1="2" y2="22" />
              </svg>
            ) : (
              /* Eye Icon (When password is hidden, clicking will show) */
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Helper text or Error */}
      {error ? (
        <span style={{ fontSize: '12px', color: 'var(--error)' }}>{error}</span>
      ) : helperText ? (
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
          {helperText}
        </div>
      ) : null}
    </div>
  );
};

export default Input;
