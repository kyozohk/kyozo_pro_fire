'use client';

import React, { Suspense } from 'react';
import DashboardContent from './DashboardContent';
import { Loading } from '@/components/dashboard';

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
    <Suspense fallback={<Loading message="Loading dashboard..." size="large" />}>
      <DashboardContent stats={initialStats} />
    </Suspense>
  );
}
