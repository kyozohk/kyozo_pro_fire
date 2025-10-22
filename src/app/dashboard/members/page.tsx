'use client';

import React, { useState, Suspense } from 'react';
import { Users } from 'lucide-react';
import { CommunitySelect, MembersDisplay, Loading } from '@/components/dashboard';
import styles from './Members.module.scss';

const MembersPage: React.FC = () => {
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>('');

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Members</h1>
          <p className={styles.subtitle}>
            View and manage all members across your communities
          </p>
        </div>
      </div>

      <div className={styles.communitySelector}>
        <Suspense fallback={<div className={styles.dropdownSkeleton}></div>}>
          <CommunitySelect
            value={selectedCommunityId}
            onChange={setSelectedCommunityId}
            placeholder="Select a community to view members"
            showSearch={true}
          />
        </Suspense>
      </div>

      {selectedCommunityId ? (
        <Suspense fallback={<Loading message="Loading members..." />}>
          <MembersDisplay
            communityId={selectedCommunityId}
            title="Community Members"
          />
        </Suspense>
      ) : (
        <div className={styles.emptyState}>
          <Users size={48} className={styles.emptyIcon} />
          <h3>No Community Selected</h3>
          <p>Please select a community from the dropdown above to view its members.</p>
        </div>
      )}
    </div>
  );
};

export default MembersPage;
