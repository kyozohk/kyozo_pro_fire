'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { useSuspenseQuery } from '@/firebase/hooks/use-suspense-query';
import { collection, query, where, DocumentData } from 'firebase/firestore';
import { ChevronDown, Search } from 'lucide-react';
import styles from './CommunitySelect.module.scss';

// Types
interface Community extends DocumentData {
  id: string;
  name: string;
  communityProfileImage?: string;
  logoURL?: string;
  slug?: string;
}

interface SuspenseCommunitySelectProps {
  value: string;
  onChange: (communityId: string) => void;
  placeholder?: string;
  className?: string;
  showSearch?: boolean;
}

// This component will be used with Suspense
const SuspenseCommunitySelect: React.FC<SuspenseCommunitySelectProps> = ({
  value,
  onChange,
  placeholder = 'Select a community',
  className = '',
  showSearch = true
}) => {
  console.log('🔎 SuspenseCommunitySelect - Component rendering');
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const selectRef = useRef<HTMLDivElement>(null);
  const firestore = useFirestore();
  
  console.log('🔥 Firestore instance:', firestore ? 'Available' : 'Not available');
  
  // Query for communities
  const communitiesQuery = useMemoFirebase(() => {
    console.log('📚 Creating communities query...');
    if (!firestore) {
      console.log('⚠️ No firestore instance available');
      return null;
    }
    const q = query(collection(firestore, 'communities'), where('name', '!=', ''));
    console.log('✅ Query created:', q ? 'Valid query' : 'Invalid query');
    return q;
  }, [firestore]);
  
  console.log('🔍 About to call useSuspenseQuery with query:', communitiesQuery ? 'Valid query' : 'No query');
  
  // Use our suspense query hook
  let communities: Community[] = [];
  
  // We don't need a try-catch here because Suspense will handle the thrown promise
  // and Error Boundary will handle any errors
  communities = useSuspenseQuery<Community>(communitiesQuery);
  console.log('🎉 Communities data received:', communities?.length || 0, 'communities');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter communities based on search query
  const filteredCommunities = communities?.filter((community: Community) => 
    community.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Find selected community
  const selectedCommunity = communities?.find((community: Community) => community.id === value);

  const handleSelect = (communityId: string) => {
    onChange(communityId);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={`${styles.selectContainer} ${className}`} ref={selectRef}>
      <div 
        className={`${styles.selectTrigger} ${isOpen ? styles.open : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedCommunity ? (
          <div className={styles.selectedOption}>
            {selectedCommunity.logoURL ? (
              <img 
                src={selectedCommunity.logoURL} 
                alt={`${selectedCommunity.name} logo`}
                className={`${styles.communityLogo} ${styles.communityIcon}`}
              />
            ) : (
              <div className={`${styles.communityLogoPlaceholder} ${styles.communityIcon}`}>
                {selectedCommunity.name?.charAt(0)?.toUpperCase() || 'C'}
              </div>
            )}
            <span>{selectedCommunity.name}</span>
          </div>
        ) : (
          <span className={styles.placeholder}>{placeholder}</span>
        )}
        <div className={`${styles.arrow} ${isOpen ? styles.open : ''}`}>
          <ChevronDown size={16} />
        </div>
      </div>

      {isOpen && (
        <div className={styles.dropdown}>
          {showSearch && (
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search communities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          )}
          
          {!filteredCommunities || filteredCommunities.length === 0 ? (
            <div className={styles.noResults}>
              {communities?.length === 0 ? 'No communities available' : 'No matching communities'}
            </div>
          ) : (
            filteredCommunities.map((community: Community) => (
              <div
                key={community.id}
                className={`${styles.option} ${community.id === value ? styles.selected : ''}`}
                onClick={() => handleSelect(community.id)}
              >
                {community.logoURL ? (
                  <img 
                    src={community.logoURL} 
                    alt={`${community.name} logo`}
                    className={`${styles.communityLogo} ${styles.communityIcon}`}
                  />
                ) : (
                  <div className={`${styles.communityLogoPlaceholder} ${styles.communityIcon}`}>
                    {community.name?.charAt(0)?.toUpperCase() || 'C'}
                  </div>
                )}
                <span className={styles.optionText}>{community.name}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SuspenseCommunitySelect;
