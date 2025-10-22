'use client';

import React from 'react';

interface LoadingProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

const Loading: React.FC<LoadingProps> = ({ 
  message = 'Loading...', 
  size = 'medium' 
}) => {
  const getSize = () => {
    switch (size) {
      case 'small': return 'w-6 h-6';
      case 'large': return 'w-12 h-12';
      default: return 'w-8 h-8';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-[200px]">
      <div className={`animate-spin text-accent-purple ${getSize()}`}>⟳</div>
      <p className="mt-4 text-text-secondary">{message}</p>
    </div>
  );
};

export default Loading;
