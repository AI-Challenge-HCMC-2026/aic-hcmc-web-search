import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  badge?: string;
  description?: string;
}

export interface SelectProps {
  label?: string;
  helperText?: React.ReactNode;
  options: SelectOption[];
  value?: string;
  onChange?: (e: { target: { value: string; name?: string } }) => void;
  onSelect?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  name?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  helperText,
  options,
  value,
  onChange,
  onSelect,
  error,
  disabled = false,
  placeholder = 'Chọn một tùy chọn...',
  className = '',
  style,
  id,
  name,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTriggerFocused, setIsTriggerFocused] = useState(false);
  const [hoveredValue, setHoveredValue] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : 'custom-select');
  const listboxId = `${selectId}-listbox`;

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectOption = useCallback(
    (optValue: string) => {
      if (disabled) return;
      if (onChange) {
        onChange({ target: { value: optValue, name } });
      }
      if (onSelect) {
        onSelect(optValue);
      }
      setIsOpen(false);
    },
    [disabled, onChange, onSelect, name]
  );

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
        const currentIndex = options.findIndex((opt) => opt.value === value);
        setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < options.length) {
          handleSelectOption(options[highlightedIndex].value);
        }
        break;
      case 'Escape':
      case 'Tab':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        width: '100%',
        position: 'relative',
        ...style,
      }}
      className={`ui-select-wrapper ${className}`}
    >
      {/* Label */}
      {label && (
        <label
          id={`${selectId}-label`}
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

      {/* Trigger Button */}
      <div style={{ position: 'relative', width: '100%' }}>
        <button
          id={selectId}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-labelledby={label ? `${selectId}-label` : undefined}
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              setIsOpen((prev) => !prev);
              const currentIndex = options.findIndex((opt) => opt.value === value);
              setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
            }
          }}
          onFocus={() => setIsTriggerFocused(true)}
          onBlur={() => setIsTriggerFocused(false)}
          onKeyDown={handleKeyDown}
          style={{
            width: '100%',
            height: '42px',
            backgroundColor: 'var(--bg-surface-subtle)',
            border: error
              ? '1px solid var(--error)'
              : isOpen || isTriggerFocused
              ? '1px solid var(--border-focus)'
              : '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md, 12px)',
            padding: '0 36px 0 14px',
            color: selectedOption ? 'var(--text-primary)' : 'var(--text-tertiary)',
            fontSize: '13.5px',
            fontFamily: 'var(--font-sans)',
            textAlign: 'left',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
            outline: 'none',
            boxShadow: isOpen || isTriggerFocused ? '0 0 0 3px var(--accent-terracotta-subtle)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            userSelect: 'none',
            transition: 'border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease',
          }}
        >
          {/* Selected Option Content */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontWeight: selectedOption ? 500 : 400,
              }}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>

            {selectedOption?.badge && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--accent-terracotta-subtle)',
                  color: 'var(--accent-terracotta)',
                  border: '1px solid rgba(218, 119, 86, 0.25)',
                  flexShrink: 0,
                  lineHeight: '1.2',
                }}
              >
                {selectedOption.badge}
              </span>
            )}
          </div>

          {/* Smooth Rotating Chevron Icon */}
          <span
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              marginTop: '-8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isOpen ? 'var(--accent-terracotta)' : 'var(--text-tertiary)',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), color 0.18s ease',
              pointerEvents: 'none',
            }}
            aria-hidden="true"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </button>

        {/* ─── Floating Menu Popover (Claude Dark Mode) ─── */}
        {isOpen && (
          <ul
            id={listboxId}
            ref={listboxRef}
            role="listbox"
            tabIndex={-1}
            aria-label={label}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '6px',
              backgroundColor: 'var(--bg-surface-elevated, #292825)',
              border: '1px solid var(--border-default, rgba(255, 255, 255, 0.12))',
              borderRadius: 'var(--radius-md, 12px)',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.55), 0 0 1px rgba(255, 255, 255, 0.08)',
              padding: '5px',
              listStyle: 'none',
              zIndex: 100,
              maxHeight: '260px',
              overflowY: 'auto',
              outline: 'none',
              animation: 'fadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {options.map((opt, index) => {
              const isSelected = opt.value === value;
              const isHovered = hoveredValue === opt.value;
              const isHighlighted = highlightedIndex === index;
              const isItemActive = isSelected || isHovered || isHighlighted;

              return (
                <li
                  key={opt.value}
                  role="option"
                  id={`${selectId}-option-${opt.value}`}
                  aria-selected={isSelected}
                  onMouseEnter={() => {
                    setHoveredValue(opt.value);
                    setHighlightedIndex(index);
                  }}
                  onMouseLeave={() => setHoveredValue(null)}
                  onClick={() => handleSelectOption(opt.value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm, 8px)',
                    backgroundColor: isSelected
                      ? 'var(--bg-surface-active, #32302b)'
                      : isItemActive
                      ? 'rgba(255, 255, 255, 0.06)'
                      : 'transparent',
                    color: isSelected ? 'var(--text-primary)' : isItemActive ? '#ffffff' : 'var(--text-secondary)',
                    fontSize: '13.5px',
                    fontFamily: 'var(--font-sans)',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'background-color 0.12s ease, color 0.12s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    {/* Checkmark indicator for selected item */}
                    <span
                      style={{
                        width: '16px',
                        height: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent-terracotta)',
                        opacity: isSelected ? 1 : 0,
                        transition: 'opacity 0.15s ease',
                        flexShrink: 0,
                      }}
                      aria-hidden="true"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>

                    <span
                      style={{
                        fontWeight: isSelected ? 500 : 400,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {opt.label}
                    </span>
                  </div>

                  {/* Badge */}
                  {opt.badge && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 7px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: isSelected ? 'var(--accent-terracotta-subtle)' : 'rgba(255, 255, 255, 0.08)',
                        color: isSelected ? 'var(--accent-terracotta)' : 'var(--text-tertiary)',
                        border: isSelected ? '1px solid rgba(218, 119, 86, 0.3)' : '1px solid var(--border-subtle)',
                        flexShrink: 0,
                        lineHeight: '1.2',
                      }}
                    >
                      {opt.badge}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
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

export default Select;
