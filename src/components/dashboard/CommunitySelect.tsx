'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, DocumentData } from 'firebase/firestore';
import { ChevronDown, Search } from 'lucide-react';
import Loading from './Loading';
import styles from './CommunitySelect.module.scss';

// Types
interface Community extends DocumentData {
  id: string;
  name: string;
  communityProfileImage?: string;
  logoURL?: string;
  slug?: string;
}

interface CommunitySelectProps {
  value: string;
  onChange: (communityId: string) => void;
  placeholder?: string;
  className?: string;
  showSearch?: boolean;
}

// This is the component that actually loads the data
const CommunitySelectContent: React.FC<CommunitySelectProps> = ({
  value,
  onChange,
  placeholder = 'Select a community',
  className = '',
  showSearch = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const selectRef = useRef<HTMLDivElement>(null);
  const firestore = useFirestore();
  
  // Query for communities
  const communitiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'communities'), where('name', '!=', ''));
  }, [firestore]);
  
  const { data: communities, isLoading, error } = useCollection<Community>(communitiesQuery);

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
  const filteredCommunities = communities?.filter(community => 
    community.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Find selected community
  const selectedCommunity = communities?.find(community => community.id === value);

  const handleSelect = (communityId: string) => {
    onChange(communityId);
    setIsOpen(false);
    setSearchQuery('');
  };

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
                className={styles.communityLogo}
              />
            ) : (
              <div className={styles.communityLogoPlaceholder}>
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
            filteredCommunities.map((community) => (
              <div
                key={community.id}
                className={`${styles.option} ${community.id === value ? styles.selected : ''}`}
                onClick={() => handleSelect(community.id)}
              >
                {community.logoURL ? (
                  <img 
                    src={community.logoURL} 
                    alt={`${community.name} logo`}
                    className={styles.communityLogo}
                  />
                ) : (
                  <div className={styles.communityLogoPlaceholder}>
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

// This is the wrapper component with Suspense
const CommunitySelect: React.FC<CommunitySelectProps> = (props) => {
  return (
    <Suspense fallback={<Loading message="Loading..." size="small" />}>
      <CommunitySelectContent {...props} />
    </Suspense>
  );
};

export default CommunitySelect;
