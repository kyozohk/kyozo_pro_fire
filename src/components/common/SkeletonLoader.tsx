'use client';

import React from 'react';
import styles from './SkeletonLoader.module.scss';

interface SkeletonLoaderProps {
  type?: 'text' | 'rectangle' | 'circle' | 'dropdown';
  width?: string;
  height?: string;
  className?: string;
  count?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type = 'text',
  width,
  height,
  className = '',
  count = 1
}) => {
  const getSkeletonClass = () => {
    switch (type) {
      case 'circle':
        return styles.circle;
      case 'dropdown':
        return styles.dropdown;
      case 'rectangle':
        return styles.rectangle;
      case 'text':
      default:
        return styles.text;
    }
  };

  const skeletonClass = `${styles.skeleton} ${getSkeletonClass()} ${className}`;
  const skeletonStyle = {
    width,
    height
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={skeletonClass} style={skeletonStyle} />
      ))}
    </>
  );
};

export default SkeletonLoader;
