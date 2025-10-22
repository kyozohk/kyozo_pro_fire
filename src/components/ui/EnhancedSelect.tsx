'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import styles from './EnhancedSelect.module.scss';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  image?: string;
  communityProfileImage?: string; // Added to support community profile images
  logoURL?: string; // Added to support community logo URLs
}

interface EnhancedSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  maxHeight?: string;
  disabled?: boolean;
}

const EnhancedSelect: React.FC<EnhancedSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  className = '',
  maxHeight = '20rem',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const selectRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Find selected option
  const selectedOption = options.find(option => option.value === value);
  
  // Filter options based on search query
  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);
  
  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setSearchQuery('');
    }
  };
  
  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
  };
  
  // Close dropdown when clicking outside (when open)
  useEffect(() => {
    if (isOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
          setIsOpen(false);
          setSearchQuery('');
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);
  
  // Render option with icon or image
  const renderOptionContent = (option: SelectOption) => {
    // First try to use community-specific images
    if (option.logoURL || option.communityProfileImage) {
      return (
        <>
          <img 
            src={option.logoURL || option.communityProfileImage} 
            alt={`${option.label} logo`} 
            className={styles.optionImage}
          />
          <span className={styles.optionLabel}>{option.label}</span>
        </>
      );
    }
    
    // Then try to use the generic image if available
    if (option.image) {
      return (
        <>
          <img 
            src={option.image} 
            alt={option.label} 
            className={styles.optionImage}
          />
          <span className={styles.optionLabel}>{option.label}</span>
        </>
      );
    }
    
    // Then try to use the icon if available
    if (option.icon) {
      return (
        <>
          <span className={styles.optionIcon}>{option.icon}</span>
          <span className={styles.optionLabel}>{option.label}</span>
        </>
      );
    }
    
    // Fallback to first letter
    return (
      <>
        <div className={styles.optionIcon}>
          {option.label.charAt(0).toUpperCase()}
        </div>
        <span className={styles.optionLabel}>{option.label}</span>
      </>
    );
  };
  
  return (
    <div className={`${styles.selectContainer} ${className}`} ref={selectRef}>
      {!isOpen ? (
        // Closed state - show trigger
        <div 
          className={`${styles.selectTrigger} ${disabled ? styles.disabled : ''}`}
          onClick={handleToggle}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          {selectedOption ? (
            <div className={styles.selectedOption}>
              {renderOptionContent(selectedOption)}
            </div>
          ) : (
            <span className={styles.placeholder}>{placeholder}</span>
          )}
          <div className={styles.arrow}>
            <ChevronDown size={16} />
          </div>
        </div>
      ) : (
        // Open state - show three-part dropdown
        <div className={styles.dropdownContainer}>
          {/* Part 1: Search component with rounded top */}
          <div className={styles.searchComponent}>
            <Search size={16} className={styles.searchIcon} />
            <input
              ref={searchInputRef}
              type="text"
              className={styles.searchInput}
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>
          
          {/* Part 2: Options list with straight edges */}
          <div className={styles.optionsList}>
            {filteredOptions.length === 0 ? (
              <div className={styles.noResults}>No options found</div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={`${styles.option} ${option.value === value ? styles.selected : ''}`}
                  onClick={() => handleSelect(option.value)}
                  role="option"
                  aria-selected={option.value === value}
                >
                  {renderOptionContent(option)}
                </div>
              ))
            )}
          </div>
          
          {/* Part 3: Bottom component with rounded bottom */}
          <div className={styles.bottomComponent}></div>
        </div>
      )}
    </div>
  );
};

export default EnhancedSelect;
