import React from 'react';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id,
}) => {
  const switchId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '16px',
        width: '100%',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
      onClick={() => {
        if (!disabled) onChange(!checked);
      }}
    >
      {(label || description) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
          {label && (
            <label
              htmlFor={switchId}
              style={{
                fontSize: '13.5px',
                fontWeight: 500,
                color: 'var(--text-primary)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {label}
            </label>
          )}
          {description && (
            <span style={{ fontSize: '12.5px', color: 'var(--text-tertiary)', lineHeight: 1.45, fontFamily: 'var(--font-sans)' }}>
              {description}
            </span>
          )}
        </div>
      )}

      {/* Track & Thumb */}
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) onChange(!checked);
        }}
        style={{
          width: '40px',
          height: '22px',
          backgroundColor: checked ? 'var(--accent-terracotta)' : 'var(--bg-surface-active)',
          borderRadius: 'var(--radius-full)',
          position: 'relative',
          border: '1px solid',
          borderColor: checked ? 'var(--accent-terracotta)' : 'var(--border-subtle)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s var(--ease-spring), border-color 0.2s var(--ease-spring)',
          flexShrink: 0,
          padding: '1px',
          outline: 'none',
        }}
      >
        <span
          style={{
            display: 'block',
            width: '18px',
            height: '18px',
            backgroundColor: '#ffffff',
            borderRadius: '50%',
            transform: checked ? 'translateX(18px)' : 'translateX(0)',
            transition: 'transform 0.2s var(--ease-spring)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
          }}
        />
      </button>
    </div>
  );
};

export default Switch;
