'use client';
import React, { forwardRef, useState } from 'react';
import styles from './Input.module.scss';

interface FloatingLabelInputProps {
  type?: string;
  placeholder?: string;
  value?: string | number;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  name?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
  error?: string;
}

const FloatingLabelInput = forwardRef<HTMLInputElement, FloatingLabelInputProps>(({
  type = 'text',
  placeholder = '',
  value,
  onChange,
  name,
  id,
  required = false,
  disabled = false,
  className = '',
  label = '',
  error = '',
  ...props
}, ref) => {
  const inputId = id || name;
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value !== undefined && value !== '';
  const showFloatingLabel = isFocused || hasValue;
  
  return (
    <div className={`${styles.inputWrapper} ${className}`}>
      <div className={`${styles.inputContainer} ${error ? styles.hasError : ''}`}>
        <input
          ref={ref}
          type={type}
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={error ? error : (showFloatingLabel ? '' : placeholder)}
          required={required}
          disabled={disabled}
          className={`${styles.input} ${error ? styles.hasError : ''}`}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {(label || placeholder) && (
          <label 
            htmlFor={inputId} 
            className={`${styles.floatingLabel} ${showFloatingLabel ? styles.active : styles.hidden}`}
          >
            {label || placeholder}
            {required && <span className={styles.required}>*</span>}
          </label>
        )}
      </div>
    </div>
  );
});

FloatingLabelInput.displayName = 'FloatingLabelInput';

export { FloatingLabelInput };
