'use client';

import React from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, DocumentData } from 'firebase/firestore';
import { EnhancedSelect } from '@/components/ui';
import styles from '@/components/ui/EnhancedSelect.module.scss';
import Loading from './Loading';

// Types
interface Community extends DocumentData {
  id: string;
  name: string;
  communityProfileImage?: string;
  logoURL?: string;
  slug?: string;
}

interface CommunitySelectExProps {
  value: string;
  onChange: (communityId: string) => void;
  placeholder?: string;
  className?: string;
}

const CommunitySelectEx: React.FC<CommunitySelectExProps> = ({
  value,
  onChange,
  placeholder = 'Select a community',
  className = '',
}) => {
  const firestore = useFirestore();
  
  // Query for communities
  const communitiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'communities'), where('name', '!=', ''));
  }, [firestore]);
  
  const { data: communities, isLoading, error } = useCollection<Community>(communitiesQuery);

  if (isLoading) {
    return (
      <div className={`${className} ${styles.loading}`} style={{ height: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 1rem', borderRadius: '0', backgroundColor: 'var(--input-background, rgba(255, 255, 255, 0.05))' }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading communities...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-500">
        <p>Error loading communities: {error.message}</p>
      </div>
    );
  }

  // Convert communities to options format for EnhancedSelect
  const options = communities?.map(community => ({
    value: community.id,
    label: community.name,
    logoURL: community.logoURL,
    communityProfileImage: community.communityProfileImage,
  })) || [];

  return (
    <EnhancedSelect
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
    />
  );
};

export default CommunitySelectEx;
