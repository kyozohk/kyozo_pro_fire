'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, DocumentData } from 'firebase/firestore';
import { Search, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import Loading from './Loading';
import styles from './MembersList.module.scss';

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
  }[];
}

interface MembersListProps {
  communityId: string;
  title?: string;
  pageSize?: number;
  onMemberClick?: (memberId: string) => void;
}

// This is the component that actually loads the data
const MembersListContent: React.FC<MembersListProps> = ({
  communityId,
  title = 'Members',
  pageSize = 10,
  onMemberClick
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
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

  // Pagination
  const totalPages = filteredMembers ? Math.ceil(filteredMembers.length / pageSize) : 0;
  const paginatedMembers = filteredMembers?.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Get role display name and class
  const getRoleInfo = (role?: string) => {
    const roleLower = role?.toLowerCase() || 'member';
    
    if (roleLower.includes('admin') || roleLower === 'commu_leader') {
      return { displayName: 'Admin', className: styles.admin };
    } else if (roleLower.includes('mod') || roleLower === 'moderator') {
      return { displayName: 'Moderator', className: styles.moderator };
    } else {
      return { displayName: 'Member', className: styles.member };
    }
  };

  if (isLoading) {
    return <Loading message="Loading members..." />;
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-500">
        <p>Error loading members: {error.message}</p>
      </div>
    );
  }

  if (!members || members.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Users size={48} opacity={0.5} />
        <h3>No Members Found</h3>
        <p>This community doesn't have any members yet.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {title && (
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <span>{members.length} members</span>
        </div>
      )}

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

      {!paginatedMembers || paginatedMembers.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No members match your search.</p>
        </div>
      ) : (
        <>
          <div className={styles.list}>
            {paginatedMembers.map((member) => {
              const roleInfo = getRoleInfo(member.role);
              const phoneNumber = member.phoneNumber || member.participation?.phoneNumber || member.waNumber || member.phone || 'No phone number';
              
              return (
                <div 
                  key={member.id} 
                  className={styles.memberItem}
                  onClick={() => onMemberClick && onMemberClick(member.id)}
                  style={{ cursor: onMemberClick ? 'pointer' : 'default' }}
                >
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
                    <h3 className={styles.memberName}>{member.fullName || 'Unknown User'}</h3>
                    <p className={styles.memberPhone}>{phoneNumber}</p>
                  </div>
                  <div className={`${styles.memberRole} ${roleInfo.className}`}>
                    {roleInfo.displayName}
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button 
                className={styles.pageButton}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={`${styles.pageButton} ${page === currentPage ? styles.active : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              
              <button 
                className={styles.pageButton}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// This is the wrapper component with Suspense
const MembersList: React.FC<MembersListProps> = (props) => {
  return (
    <Suspense fallback={<Loading message="Loading members..." />}>
      <MembersListContent {...props} />
    </Suspense>
  );
};

export default MembersList;
