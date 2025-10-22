'use client';

import React from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, DocumentData } from 'firebase/firestore';
import { EnhancedSelect } from '@/components/ui';
import Loading from './Loading';

// Types
interface Community extends DocumentData {
  id: string;
  name: string;
  communityProfileImage?: string;
  logoURL?: string;
  slug?: string;
}

interface EnhancedSelectWithCommunitiesProps {
  value: string;
  onChange: (communityId: string) => void;
  placeholder?: string;
  className?: string;
}

const EnhancedSelectWithCommunities: React.FC<EnhancedSelectWithCommunitiesProps> = ({
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
    return <Loading message="Loading communities..." size="small" />;
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

export default EnhancedSelectWithCommunities;
