'use client';

import React, { Suspense, Component, ErrorInfo, ReactNode } from 'react';
import { Loading } from '@/components/dashboard';
import SkeletonLoader from './SkeletonLoader';

interface ErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

interface SuspenseWithErrorBoundaryProps {
  children: ReactNode;
  loadingMessage?: string;
  loadingSize?: 'small' | 'medium' | 'large';
  errorFallback?: ReactNode;
  useSkeleton?: boolean;
  skeletonType?: 'text' | 'rectangle' | 'circle' | 'dropdown';
  skeletonHeight?: string;
  skeletonWidth?: string;
  skeletonClassName?: string;
  skeletonCount?: number;
}

const SuspenseWithErrorBoundary: React.FC<SuspenseWithErrorBoundaryProps> = ({
  children,
  loadingMessage = 'Loading...',
  loadingSize = 'medium',
  errorFallback = (
    <div className="p-4 text-center">
      <p className="text-red-500">Something went wrong. Please try again later.</p>
    </div>
  ),
  useSkeleton = false,
  skeletonType = 'rectangle',
  skeletonHeight,
  skeletonWidth,
  skeletonClassName = '',
  skeletonCount = 1
}) => {
  const loadingFallback = useSkeleton ? (
    <SkeletonLoader 
      type={skeletonType}
      height={skeletonHeight}
      width={skeletonWidth}
      className={skeletonClassName}
      count={skeletonCount}
    />
  ) : (
    <Loading message={loadingMessage} size={loadingSize} />
  );

  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={loadingFallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};

export default SuspenseWithErrorBoundary;
