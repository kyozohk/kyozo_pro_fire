'use client';

import React from 'react';
import styles from './Checkbox.module.scss';

interface CustomCheckboxProps {
  id: string;
  name: string;
  label: string | React.ReactNode;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

const CheckIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={3} 
    stroke="currentColor" 
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({ 
  id, 
  name, 
  label, 
  checked, 
  onChange,
  className = ''
}) => {
  return (
    <div className={`${styles.checkboxContainer} ${className}`}>
      <label htmlFor={id} className={styles.checkboxLabel}>
        <div className={styles.checkboxWrapper}>
          <input
            id={id}
            name={name}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className={styles.checkboxInput}
          />
          <div className={`${styles.checkbox} ${checked ? styles.checked : ''}`}>
            <CheckIcon className={styles.checkIcon} />
          </div>
        </div>
        <span className={styles.checkboxText}>{label}</span>
      </label>
    </div>
  );
};

export { CustomCheckbox };
