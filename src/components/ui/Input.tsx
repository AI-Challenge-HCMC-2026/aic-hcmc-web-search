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
            padding: isPasswordToggleable ? '0 64px 0 14px' : '0 14px',
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

        {/* Toggle Password Visibility */}
        {isPasswordToggleable && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            disabled={disabled}
            style={{
              position: 'absolute',
              right: '8px',
              height: '28px',
              padding: '0 10px',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              userSelect: 'none',
              transition: 'background-color 0.15s ease, color 0.15s ease',
            }}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? 'Ẩn' : 'Hiện'}
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
