/**
 * Input Component - React DOM version
 */

import React, {useState} from 'react';
import './Input.css';

export type InputVariant = 'outlined' | 'filled' | 'underlined';
export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: InputVariant;
  size?: InputSize;
  label?: string;
  helperText?: string;
  error?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  fullWidth?: boolean;
  clearable?: boolean;
  containerClassName?: string;
}

export function Input({
  variant = 'outlined',
  size = 'md',
  label,
  helperText,
  error,
  leftElement,
  rightElement,
  fullWidth = true,
  clearable = false,
  containerClassName = '',
  value,
  onChange,
  ...props
}: InputProps): React.JSX.Element {
  const [isFocused, setIsFocused] = useState(false);
  const hasError = !!error;
  const hasValue = !!value && String(value).length > 0;

  const inputClasses = [
    'input',
    `input-${variant}`,
    `input-${size}`,
    hasError && 'input-error',
    isFocused && 'input-focused',
    leftElement && 'input-with-left',
    (rightElement || (clearable && hasValue)) && 'input-with-right',
  ]
    .filter(Boolean)
    .join(' ');

  const containerClasses = [
    'input-container',
    fullWidth && 'input-container-full-width',
    containerClassName,
  ]
    .filter(Boolean)
    .join(' ');

  const handleClear = () => {
    if (onChange) {
      const event = {
        target: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(event);
    }
  };

  return (
    <div className={containerClasses}>
      {label && (
        <label className={`input-label ${hasError ? 'input-label-error' : ''}`}>
          {label}
        </label>
      )}

      <div className="input-wrapper">
        {leftElement && <span className="input-left-element">{leftElement}</span>}

        <input
          className={inputClasses}
          value={value}
          onChange={onChange}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />

        {clearable && hasValue && (
          <button
            type="button"
            className="input-clear-button"
            onClick={handleClear}
            aria-label="Clear"
          >
            ✕
          </button>
        )}

        {rightElement && <span className="input-right-element">{rightElement}</span>}
      </div>

      {(helperText || error) && (
        <div className={`input-helper ${hasError ? 'input-helper-error' : ''}`}>
          {error || helperText}
        </div>
      )}
    </div>
  );
}

export function SearchInput(props: InputProps) {
  return (
    <Input
      variant="filled"
      placeholder="Search..."
      clearable
      leftElement={<span>🔍</span>}
      {...props}
    />
  );
}
