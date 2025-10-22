'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './Select.module.scss';

interface SelectOption {
  value: string;
  label: string;
  content?: React.ReactNode;
}

interface CustomSelectProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  id,
  name,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  error,
  disabled = false,
  required = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const selectRef = useRef<HTMLDivElement>(null);
  const hiddenSelectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    const selectedOption = options.find(option => option.value === value);
    setSelectedLabel(selectedOption ? selectedOption.label : '');
  }, [value, options]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleOptionClick = (optionValue: string) => {
    // Create a synthetic event to match the expected onChange signature
    const syntheticEvent = {
      target: {
        name: name || '',
        value: optionValue,
        type: 'select-one',
      },
    } as React.ChangeEvent<HTMLSelectElement>;

    onChange(syntheticEvent);
    setIsOpen(false);

    // Also update the hidden select for form submission
    if (hiddenSelectRef.current) {
      hiddenSelectRef.current.value = optionValue;
    }
  };

  const containerClasses = [
    styles.inputContainer,
    error ? styles.hasError : '',
    className
  ].filter(Boolean).join(' ');

  const selectClasses = [
    styles.select,
    error ? styles.hasError : '',
    disabled ? styles.disabled : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.inputWrapper}>
      <div className={containerClasses} ref={selectRef}>
        {/* Hidden native select for form submission */}
        <select
          ref={hiddenSelectRef}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          style={{ display: 'none' }}
          tabIndex={-1}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Custom styled select */}
        <div
          className={selectClasses}
          onClick={handleToggle}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleToggle();
            }
          }}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <div className={styles.selectedValue}>
            {options.find(option => option.value === value)?.content || selectedLabel || placeholder}
          </div>
          <span className={`${styles.arrow} ${isOpen ? styles.open : ''}`}>
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
              <path
                d="M1 1.5L6 6.5L11 1.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>

        {/* Dropdown options */}
        {isOpen && (
          <div className={styles.dropdown}>
            {placeholder && (
              <div
                className={`${styles.option} ${!value ? styles.selected : ''}`}
                onClick={() => handleOptionClick('')}
              >
                {placeholder}
              </div>
            )}
            {options.map((option) => (
              <div
                key={option.value}
                className={`${styles.option} ${value === option.value ? styles.selected : ''}`}
                onClick={() => handleOptionClick(option.value)}
              >
                {option.content ? (
                  <div className={styles.optionContent}>
                    {option.content}
                  </div>
                ) : (
                  option.label
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}
    </div>
  );
};

export { CustomSelect };
