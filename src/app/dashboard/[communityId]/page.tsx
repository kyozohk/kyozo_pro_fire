'use client';

import React from 'react';
import DashboardContent from '../DashboardContent';
import SuspenseWithErrorBoundary from '@/components/common/SuspenseWithErrorBoundary';

// This is a wrapper component that uses Suspense
export default function CommunityAnalyticsPage() {
  // Initial stats - these will be updated by the DashboardContent component
  const initialStats = {
    totalMembers: 0,
    activeMembers: 0,
    totalMessages: 0,
    unreadMessages: 0,
    growthRate: 0,
    newMembersThisMonth: 0,
    messagesSentThisMonth: 0
  };

  return (
    <SuspenseWithErrorBoundary
      loadingMessage="Loading analytics..."
      loadingSize="large"
      errorFallback={
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold text-red-500">Error</h2>
          <p className="mt-2">Failed to load analytics data</p>
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
