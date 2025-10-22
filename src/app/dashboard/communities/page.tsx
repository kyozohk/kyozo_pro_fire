'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { CommunityList, Loading } from '@/components/dashboard';
import styles from './communities.module.scss';

const CommunitiesHeader: React.FC = () => {
  const router = useRouter();
  
  return (
    <div className={styles.header}>
      <div>
        <h1 className={styles.title}>Communities</h1>
        <p className={styles.subtitle}>
          Explore and engage with creative communities
        </p>
      </div>
      <div>         
        <button 
          className={styles.createButton}
          onClick={() => router.push('/dashboard/communities/new')}
        >
          <Plus size={20} />
          Create Community
        </button>
      </div>
    </div>
  );
};

const CommunitiesPage: React.FC = () => {
  return (
    <div className={styles.container}>
      <CommunitiesHeader />
      
      <Suspense fallback={<Loading message="Loading communities..." />}>
        <CommunityList 
          defaultView="card" 
          title="" 
          showViewToggle={true} 
          linkPrefix="/dashboard/communities"
        />
      </Suspense>
    </div>
  );
};

export default CommunitiesPage;
