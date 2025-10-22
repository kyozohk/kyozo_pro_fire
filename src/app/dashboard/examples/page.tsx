'use client';

import React, { useState, Suspense } from 'react';
import { CommunityList, CommunitySelect, MembersList, Loading, CommunityHeader, CommunitySelectEx } from '@/components/dashboard';
import { EnhancedSelect } from '@/components/ui';
import styles from '../Dashboard.module.scss';

const ExamplesPage: React.FC = () => {
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>('');

  return (
    <div className={styles.dashboardContent}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Component Examples</h1>
          <p className={styles.subtitle}>
            Examples of dashboard components with Suspense
          </p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className={styles.sectionTitle}>CommunitySelect Component</h2>
        <p className="mb-4 text-text-secondary">
          A dropdown that loads all communities with icons and names
        </p>
        
        <div className="max-w-md">
          <Suspense fallback={<Loading message="Loading community select..." size="small" />}>
            <CommunitySelect
              value={selectedCommunityId}
              onChange={setSelectedCommunityId}
              placeholder="Select a community"
              showSearch={true}
            />
          </Suspense>
        </div>
      </div>

      <div className="mb-8">
        <h2 className={styles.sectionTitle}>CommunityList Component - Card View</h2>
        <p className="mb-4 text-text-secondary">
          A list of communities with card view and list view options
        </p>
        
        <Suspense fallback={<Loading message="Loading communities..." />}>
          <CommunityList
            defaultView="card"
            title="Communities"
            showViewToggle={true}
            maxItems={6}
          />
        </Suspense>
      </div>

      <div className="mb-8">
        <h2 className={styles.sectionTitle}>CommunityHeader Component</h2>
        <p className="mb-4 text-text-secondary">
          A header component for community pages with actions
        </p>
        
        {selectedCommunityId ? (
          <div className="p-6 bg-card-bg rounded-lg">
            <CommunityHeader
              communityName="Example Community"
              communityId={selectedCommunityId}
              description="This is an example community to demonstrate the CommunityHeader component"
              showBreadcrumbs={true}
              showActions={true}
            />
          </div>
        ) : (
          <div className="p-8 text-center bg-card-bg rounded-lg">
            <p>Please select a community above to view the header example</p>
          </div>
        )}
      </div>

      <div className="mb-8">
        <h2 className={styles.sectionTitle}>MembersList Component</h2>
        <p className="mb-4 text-text-secondary">
          A list of members in the selected community
        </p>
        
        {selectedCommunityId ? (
          <Suspense fallback={<Loading message="Loading members..." />}>
            <MembersList
              communityId={selectedCommunityId}
              title={`Members in Selected Community`}
              pageSize={5}
            />
          </Suspense>
        ) : (
          <div className="p-8 text-center bg-card-bg rounded-lg">
            <p>Please select a community above to view its members</p>
          </div>
        )}
      </div>
      
      <div className="mb-8">
        <h2 className={styles.sectionTitle}>EnhancedSelect Component</h2>
        <p className="mb-4 text-text-secondary">
          A custom select component with search functionality and gradient styling
        </p>
        
        <div className="max-w-md">
          <CommunitySelectEx
            value={selectedCommunityId}
            onChange={setSelectedCommunityId}
            placeholder="Select a community"
          />
          
          <div className="mt-4 p-4 bg-card-bg rounded-lg">
            <p>For more examples, visit the <a href="/dashboard/enhanced-select-example" className="text-accent-pink">Enhanced Select</a> page</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamplesPage;
