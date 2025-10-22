'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './Dropdown.module.scss';

interface DropdownOption {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

const ChevronDownIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={2} 
    stroke="currentColor" 
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const selectedOption = options.find(option => option.value === value);
  const hasValue = !!selectedOption;
  
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };
  
  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <div className={`${styles.dropdownContainer} ${className}`} ref={dropdownRef}>
      <div 
        className={`${styles.dropdownTrigger} ${isOpen ? styles.open : ''}`}
        onClick={toggleDropdown}
      >
        {selectedOption ? selectedOption.label : placeholder}
        <ChevronDownIcon className={`${styles.dropdownIcon} ${isOpen ? styles.open : ''}`} />
      </div>
      
      {label && (
        <label 
          className={`${styles.floatingLabel} ${hasValue || isOpen ? styles.active : ''}`}
        >
          {label}
        </label>
      )}
      
      <div className={`${styles.dropdownMenu} ${isOpen ? styles.open : ''}`}>
        {options.map((option) => (
          <div 
            key={option.value}
            className={`${styles.dropdownItem} ${option.value === value ? styles.selected : ''}`}
            onClick={() => handleSelect(option.value)}
          >
            {option.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export { CustomDropdown };
