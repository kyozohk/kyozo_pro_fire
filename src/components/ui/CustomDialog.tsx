'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from './Dialog.module.scss';

interface CustomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
}

const CustomDialog: React.FC<CustomDialogProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  className = '',
  footer,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [isClosing, setIsClosing] = useState(false);

  // Handle closing animation
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  // Close on escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  // Prevent body scrolling when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen && !isClosing) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div
        ref={dialogRef}
        className={`${styles.dialog} ${className} ${isClosing ? styles.closing : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.closeButton} onClick={handleClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className={styles.dialogContent}>
          {(title || subtitle) && (
            <div className={styles.dialogHeader}>
              {title && <h2 className={styles.dialogTitle}>{title}</h2>}
              {subtitle && <p className={styles.dialogSubtitle}>{subtitle}</p>}
            </div>
          )}
          <div className={styles.dialogBody}>
            {children}
          </div>
          {footer && (
            <div className={styles.dialogFooter}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { CustomDialog };
