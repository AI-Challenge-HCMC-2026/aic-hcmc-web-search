import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  disabled,
  style,
  ...props
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isActive, setIsActive] = React.useState(false);

  const baseStyles: React.CSSProperties = {
    display: fullWidth ? 'flex' : 'inline-flex',
    width: fullWidth ? '100%' : 'auto',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: 'var(--radius-sm, 8px)',
    fontWeight: 500,
    fontFamily: 'var(--font-sans)',
    fontSize: size === 'sm' ? '13px' : size === 'lg' ? '15px' : '14px',
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.18s var(--ease-spring, cubic-bezier(0.16, 1, 0.3, 1))',
    border: '1px solid transparent',
    outline: 'none',
    userSelect: 'none',
    position: 'relative',
    ...style,
  };

  // Variant dynamic color handling for hover & active
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: isHovered && !disabled ? 'var(--accent-terracotta-hover)' : 'var(--accent-terracotta)',
          color: '#ffffff',
          boxShadow: isHovered && !disabled
            ? '0 3px 12px rgba(218, 119, 86, 0.35)'
            : '0 1px 4px rgba(218, 119, 86, 0.25)',
          transform: isHovered && !disabled && !isActive ? 'translateY(-1px)' : isActive ? 'scale(0.98)' : 'none',
        };
      case 'secondary':
        return {
          backgroundColor: isHovered && !disabled ? 'var(--bg-surface-active)' : 'var(--bg-surface-elevated)',
          color: 'var(--text-primary)',
          borderColor: 'var(--border-default)',
          transform: isActive ? 'scale(0.98)' : 'none',
        };
      case 'outline':
        return {
          backgroundColor: isHovered && !disabled ? 'var(--bg-surface-subtle)' : 'transparent',
          color: 'var(--text-primary)',
          borderColor: isHovered && !disabled ? 'var(--text-secondary)' : 'var(--border-default)',
        };
      case 'ghost':
        return {
          backgroundColor: isHovered && !disabled ? 'var(--bg-surface-subtle)' : 'transparent',
          color: isHovered && !disabled ? 'var(--text-primary)' : 'var(--text-secondary)',
        };
      case 'danger':
        return {
          backgroundColor: isHovered && !disabled ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.12)',
          color: '#f87171',
          borderColor: 'rgba(239, 68, 68, 0.25)',
        };
      default:
        return {};
    }
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: {
      padding: '5px 12px',
      height: '32px',
    },
    md: {
      padding: '8px 16px',
      height: '38px',
    },
    lg: {
      padding: '10px 22px',
      height: '44px',
    },
  };

  return (
    <button
      style={{
        ...baseStyles,
        ...getVariantStyles(),
        ...sizeStyles[size],
      }}
      disabled={disabled || isLoading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsActive(false);
      }}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
      className={`ui-button ui-button-${variant} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span
          style={{
            width: '15px',
            height: '15px',
            border: '2px solid rgba(255,255,255,0.3)',
            borderTopColor: '#FFFFFF',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
            display: 'inline-block',
          }}
          aria-hidden="true"
        />
      ) : (
        <>
          {leftIcon && <span style={{ display: 'flex', alignItems: 'center' }}>{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span style={{ display: 'flex', alignItems: 'center' }}>{rightIcon}</span>}
        </>
      )}
    </button>
  );
};

export default Button;
