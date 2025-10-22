'use client';

import React, { useState } from 'react';
import SuspenseWithErrorBoundary from '@/components/common/SuspenseWithErrorBoundary';
import { 
  SuspenseCommunityList, 
  SuspenseCommunitySelect, 
  SuspenseMembersDisplay 
} from '@/components/dashboard';
import styles from '../Dashboard.module.scss';

const SuspenseExamplePage: React.FC = () => {
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>('');

  return (
    <div className={styles.dashboardContent}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Suspense Examples</h1>
          <p className={styles.subtitle}>
            Demonstrating React Suspense with Firestore data
          </p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className={styles.sectionTitle}>Community Select with Suspense</h2>
        <p className="mb-4 text-text-secondary">
          This dropdown loads communities with Suspense
        </p>
        
        <div className="max-w-md">
          <SuspenseWithErrorBoundary 
            useSkeleton={true}
            skeletonType="dropdown"
            skeletonClassName="w-full h-10 bg-gray-700/30 rounded-md"
          >
            <SuspenseCommunitySelect
              value={selectedCommunityId}
              onChange={setSelectedCommunityId}
              placeholder="Select a community"
              showSearch={true}
            />
          </SuspenseWithErrorBoundary>
        </div>
      </div>

      <div className="mb-8">
        <h2 className={styles.sectionTitle}>Community List with Suspense</h2>
        <p className="mb-4 text-text-secondary">
          This list loads communities with Suspense
        </p>
        
        <SuspenseWithErrorBoundary 
          useSkeleton={true} 
          skeletonType="rectangle" 
          skeletonHeight="200px" 
          skeletonCount={3}
          skeletonClassName="rounded-lg mb-4"
        >
          <SuspenseCommunityList
            defaultView="card"
            title="Communities"
            showViewToggle={true}
            maxItems={6}
          />
        </SuspenseWithErrorBoundary>
      </div>

      <div className="mb-8">
        <h2 className={styles.sectionTitle}>Members Display with Suspense</h2>
        <p className="mb-4 text-text-secondary">
          This component loads members with Suspense
        </p>
        
        {selectedCommunityId ? (
          <SuspenseWithErrorBoundary 
            useSkeleton={true} 
            skeletonType="rectangle" 
            skeletonHeight="400px"
            skeletonClassName="rounded-lg"
          >
            <SuspenseMembersDisplay
              communityId={selectedCommunityId}
              title="Community Members"
            />
          </SuspenseWithErrorBoundary>
        ) : (
          <div className="p-8 text-center bg-card-bg rounded-lg">
            <p>Please select a community above to view its members</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuspenseExamplePage;
