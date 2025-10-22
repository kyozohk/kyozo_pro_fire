'use client';

import React from 'react';
import DashboardContent from './DashboardContent';
import SuspenseWithErrorBoundary from '@/components/common/SuspenseWithErrorBoundary';

// This is a wrapper component that uses Suspense
export default function DashboardPage() {
  // Initial stats - these will be updated by the DashboardContent component
  const initialStats = {
    totalCommunities: 0,
    totalMembers: 0,
    totalMessages: 0,
    growthRate: 0,
    monthlyGrowth: {
      communities: 0,
      members: 0,
      messages: 0
    },
    growthRateChange: 0
  };

  return (
    <SuspenseWithErrorBoundary
      loadingMessage="Loading dashboard..."
      loadingSize="large"
      errorFallback={
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold text-red-500">Error</h2>
          <p className="mt-2">Failed to load dashboard data</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Retry
          </button>
        </div>
      }
    >
      <DashboardContent stats={initialStats} />
    </SuspenseWithErrorBoundary>
  );
}
