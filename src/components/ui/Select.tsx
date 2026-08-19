import React, { useState } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  badge?: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  helperText?: React.ReactNode;
  options: SelectOption[];
  error?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  helperText,
  options,
  error,
  className = '',
  disabled,
  style,
  id,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', ...style }}>
      {label && (
        <label
          htmlFor={selectId}
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

      <div style={{ position: 'relative', width: '100%' }}>
        <select
          id={selectId}
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
            padding: '0 36px 0 14px',
            color: 'var(--text-primary)',
            fontSize: '13.5px',
            fontFamily: 'var(--font-sans)',
            outline: 'none',
            appearance: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
            boxShadow: isFocused ? '0 0 0 3px var(--accent-terracotta-subtle)' : 'none',
            transition: 'border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease',
          }}
          className={`ui-select ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              style={{
                backgroundColor: '#21201d',
                color: '#fbf9f4',
                padding: '8px',
              }}
            >
              {opt.label} {opt.badge ? `(${opt.badge})` : ''}
            </option>
          ))}
        </select>

        {/* Custom Chevron Icon */}
        <div
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            color: 'var(--text-tertiary)',
          }}
          aria-hidden="true"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

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

export default Select;
