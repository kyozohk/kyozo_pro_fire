'use client';

import React from 'react';
import styles from './Radio.module.scss';

interface CustomRadioProps {
  id: string;
  name: string;
  label: string | React.ReactNode;
  checked: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

const CustomRadio: React.FC<CustomRadioProps> = ({ 
  id, 
  name, 
  label, 
  checked, 
  value,
  onChange,
  className = ''
}) => {
  return (
    <div className={`${styles.radioContainer} ${className}`}>
      <label htmlFor={id} className={styles.radioLabel}>
        <div className={styles.radioWrapper}>
          <input
            id={id}
            name={name}
            type="radio"
            value={value}
            checked={checked}
            onChange={onChange}
            className={styles.radioInput}
          />
          <div className={`${styles.radio} ${checked ? styles.checked : ''}`}>
            <div className={styles.radioInner}></div>
          </div>
        </div>
        <span className={styles.radioText}>{label}</span>
      </label>
    </div>
  );
};

export { CustomRadio };
