'use client';

import React from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, DocumentData } from 'firebase/firestore';
import { EnhancedSelect } from '@/components/ui';
import styles from '@/components/ui/EnhancedSelect.module.scss';

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

  // Handle community selection with direct navigation
  const handleChange = (communityId: string) => {
    console.log('CommunitySelectEx onChange called with:', communityId);
    
    // Check if this is the currently selected community
    if (communityId === value) {
      console.log('Community already selected, skipping navigation');
      return;
    }
    
    // Find the selected community
    const selectedCommunity = communities?.find(community => community.id === communityId);
    console.log('Selected community:', selectedCommunity);
    
    if (selectedCommunity) {
      // Get the current path to extract the section
      const pathname = window.location.pathname;
      const basePath = '/dashboard';
      const currentPath = pathname.replace(basePath, '');
      const segments = currentPath.split('/').filter(Boolean);
      
      // Determine if we're in a section or at the dashboard root
      let section = '';
      if (segments.length > 0 && ['messages', 'members', 'subscription', 'suspense-example'].includes(segments[0])) {
        section = segments[0];
      }
      
      // Use the community ID directly as the URL parameter
      const communityId = selectedCommunity.id;
      
      // Navigate to the section with the community ID
      const newPath = section 
        ? `/dashboard/${section}/${communityId}` 
        : `/dashboard/${communityId}`;
      
      console.log('Navigating to:', newPath);
      
      // Call the onChange handler first to update the parent state
      onChange(communityId);
      
      // Use window.location for a hard navigation to ensure it works
      window.location.href = newPath;
    } else {
      // Still call the onChange handler if we can't navigate
      onChange(communityId);
    }
  };

  return (
    <EnhancedSelect
      options={options}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
    />
  );
};

export default CommunitySelectEx;
