'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { useSuspenseQuery } from '@/firebase/hooks/use-suspense-query';
import { collection, query, where, DocumentData } from 'firebase/firestore';
import { Users, Grid, List as ListIcon, Building2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import styles from './CommunityList.module.scss';

// Types
interface Community extends DocumentData {
  id: string;
  name: string;
  communityProfileImage?: string;
  description?: string;
  isPublic?: boolean;
  memberCount?: number;
  slug?: string;
  logoURL?: string;
  createdAt?: any;
}

interface SuspenseCommunityListProps {
  defaultView?: 'card' | 'list';
  title?: string;
  showViewToggle?: boolean;
  maxItems?: number;
  linkPrefix?: string;
}

// Format date helper function
const formatDate = (date: any): string => {
  if (!date) return 'No date';
  
  try {
    // Handle Firestore Timestamp
    if (date && (date.seconds || date._seconds)) {
      const seconds = date.seconds || date._seconds;
      return format(new Date(seconds * 1000), 'MMM d, yyyy');
    }
    
    // Handle regular Date object or ISO string
    return format(new Date(date), 'MMM d, yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

// This component will be used with Suspense
const SuspenseCommunityList: React.FC<SuspenseCommunityListProps> = ({
  defaultView = 'card',
  title = 'Communities',
  showViewToggle = true,
  maxItems,
  linkPrefix = '/dashboard/communities'
}) => {
  const [view, setView] = useState<'card' | 'list'>(defaultView);
  const firestore = useFirestore();
  
  // Query for communities
  const communitiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'communities'), where('name', '!=', ''));
  }, [firestore]);
  
  // Use our suspense query hook
  const communities = useSuspenseQuery<Community>(communitiesQuery);
  
  // Apply maxItems limit if specified
  const displayCommunities = maxItems ? communities?.slice(0, maxItems) : communities;

  if (!displayCommunities || displayCommunities.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Building2 size={48} opacity={0.5} />
        <h3>No Communities Found</h3>
        <p>There are no communities available.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {(title || showViewToggle) && (
        <div className={styles.header}>
          {title && <h2 className={styles.title}>{title}</h2>}
          
          {showViewToggle && (
            <div className={styles.viewToggle}>
              <button 
                className={`${styles.viewButton} ${view === 'card' ? styles.active : ''}`}
                onClick={() => setView('card')}
                aria-label="Card view"
              >
                <Grid size={20} />
              </button>
              <button 
                className={`${styles.viewButton} ${view === 'list' ? styles.active : ''}`}
                onClick={() => setView('list')}
                aria-label="List view"
              >
                <ListIcon size={20} />
              </button>
            </div>
          )}
        </div>
      )}

      {view === 'card' ? (
        <div className={styles.cardGrid}>
          {displayCommunities.map((community: Community) => (
            <Link
              key={community.id}
              href={`${linkPrefix}/${community.slug || community.id}`}
              className={styles.card}
            >
              <div className={styles.cardContent}>
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
                <div className={styles.communityInfo}>
                  <h3 className={styles.communityName}>{community.name}</h3>
                  <div className={styles.communityMeta}>
                    <Users size={14} />
                    <span>{community.memberCount || 0} members</span>
                  </div>
                  <div className={styles.creationDate}>
                    <Calendar size={14} />
                    <span>Created {formatDate(community.createdAt)}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className={styles.list}>
          {displayCommunities.map((community: Community) => (
            <Link
              key={community.id}
              href={`${linkPrefix}/${community.slug || community.id}`}
              className={styles.listItem}
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
              <div className={styles.communityInfo}>
                <h3 className={styles.communityName}>{community.name}</h3>
                <div className={styles.communityMeta}>
                  <Users size={14} />
                  <span>{community.memberCount || 0} members</span>
                  <span className="mx-2">•</span>
                  <Calendar size={14} />
                  <span>Created {formatDate(community.createdAt)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default SuspenseCommunityList;
