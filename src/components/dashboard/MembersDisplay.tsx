'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, DocumentData } from 'firebase/firestore';
import { Search, Users, Grid, List as ListIcon, Calendar, Crown } from 'lucide-react';
import { format } from 'date-fns';
import Loading from './Loading';
import styles from '../../app/dashboard/members/Members.module.scss';

// Types
interface UserProfile extends DocumentData {
  id: string;
  fullName?: string;
  phoneNumber?: string;
  role?: string;
  profileImage?: string;
  participation?: {
    phoneNumber?: string;
  };
  waNumber?: string;
  phone?: string;
  communityMemberships?: {
    community: string;
    fullName?: string;
    phoneNumber?: string;
    role?: string;
    joinedAt?: any;
  }[];
  createdAt?: any;
}

interface MembersDisplayProps {
  communityId: string;
  title?: string;
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

// This is the component that actually loads the data
const MembersDisplayContent: React.FC<MembersDisplayProps> = ({
  communityId,
  title = 'Members'
}) => {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const firestore = useFirestore();
  
  // Query for users
  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);
  
  const { data: allUsers, isLoading, error } = useCollection<UserProfile>(usersQuery);

  // Filter users who are members of the specified community
  const members = allUsers?.filter(user => 
    user.communityMemberships?.some((membership: any) => membership.community === communityId)
  );

  // Filter members based on search query
  const filteredMembers = members?.filter(member => {
    const fullName = member.fullName?.toLowerCase() || '';
    const phoneNumber = member.phoneNumber || member.participation?.phoneNumber || member.waNumber || member.phone || '';
    return fullName.includes(searchQuery.toLowerCase()) || phoneNumber.includes(searchQuery);
  });

  // Get membership details for a specific community
  const getMembershipDetails = (user: UserProfile) => {
    const membership = user.communityMemberships?.find(
      (m: any) => m.community === communityId
    );
    return membership || { role: '', joinedAt: null };
  };

  // Check if user is an admin
  const isAdmin = (user: UserProfile) => {
    const role = user.role?.toLowerCase() || '';
    const membershipRole = getMembershipDetails(user).role?.toLowerCase() || '';
    return role.includes('admin') || 
           role === 'commu_leader' || 
           membershipRole.includes('admin') || 
           membershipRole === 'commu_leader';
  };

  if (isLoading) {
    return <Loading message="Loading members..." />;
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        <h2>Error</h2>
        <p>{error.message}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!members || members.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Users size={48} className={styles.emptyIcon} />
        <h3>No Members Found</h3>
        <p>This community doesn't have any members yet.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className={styles.searchIcon} size={16} />
        </div>
        
        <div className={styles.viewToggle}>
          <button 
            className={`${styles.viewButton} ${view === 'grid' ? styles.active : ''}`}
            onClick={() => setView('grid')}
            aria-label="Grid view"
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
      </div>

      {!filteredMembers || filteredMembers.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No members match your search.</p>
        </div>
      ) : view === 'grid' ? (
        <div className={styles.membersGrid}>
          {filteredMembers.map((member) => {
            const membership = getMembershipDetails(member);
            const phoneNumber = member.phoneNumber || member.participation?.phoneNumber || member.waNumber || member.phone || 'No phone number';
            const joinedAt = membership.joinedAt || member.createdAt;
            const admin = isAdmin(member);
            
            return (
              <div key={member.id} className={styles.memberCard}>
                <div className={styles.memberHeader}>
                  {member.profileImage ? (
                    <img 
                      src={member.profileImage} 
                      alt={`${member.fullName || 'User'}`}
                      className={styles.memberAvatar}
                    />
                  ) : (
                    <div className={styles.memberAvatarPlaceholder}>
                      {member.fullName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className={styles.memberInfo}>
                    <div className={styles.memberNameRow}>
                      <h3 className={styles.memberName}>{member.fullName || 'Unknown User'}</h3>
                      {admin && <span className={styles.adminBadge}>Admin</span>}
                    </div>
                    <p className={styles.memberPhone}>{phoneNumber}</p>
                    <div className={styles.memberJoinedDate}>
                      <Calendar size={14} />
                      <span>Joined {formatDate(joinedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.membersList}>
          {filteredMembers.map((member) => {
            const membership = getMembershipDetails(member);
            const phoneNumber = member.phoneNumber || member.participation?.phoneNumber || member.waNumber || member.phone || 'No phone number';
            const joinedAt = membership.joinedAt || member.createdAt;
            const admin = isAdmin(member);
            
            return (
              <div key={member.id} className={styles.memberRow}>
                {member.profileImage ? (
                  <img 
                    src={member.profileImage} 
                    alt={`${member.fullName || 'User'}`}
                    className={styles.memberAvatar}
                  />
                ) : (
                  <div className={styles.memberAvatarPlaceholder}>
                    {member.fullName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <div className={styles.memberDetails}>
                  <div className={styles.memberNameRow}>
                    <h3 className={styles.memberName}>{member.fullName || 'Unknown User'}</h3>
                    {admin && (
                      <Crown size={16} color="gold" />
                    )}
                  </div>
                  <p className={styles.memberPhone}>{phoneNumber}</p>
                  <div className={styles.memberJoinedDate}>
                    <Calendar size={14} />
                    <span>Joined {formatDate(joinedAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// This is the wrapper component with Suspense
const MembersDisplay: React.FC<MembersDisplayProps> = (props) => {
  return (
    <Suspense fallback={<Loading message="Loading members..." />}>
      <MembersDisplayContent {...props} />
    </Suspense>
  );
};

export default MembersDisplay;
