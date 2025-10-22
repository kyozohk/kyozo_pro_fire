'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, User, Crown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import styles from './SimpleMembersList.module.scss';

export interface Member {
  id: string;
  fullName?: string;
  name?: string;
  displayName?: string;
  email?: string;
  phoneNumber?: string;
  phone?: string;
  waNumber?: string;
  profileImage?: string;
  role?: string;
  status?: 'active' | 'pending' | 'inactive';
  lastMessageTimestamp?: number;
}

interface SimpleMembersListProps {
  members: Member[];
  onSelectMember: (member: Member) => void;
  selectedMemberId?: string;
  className?: string;
  isLoading?: boolean;
}

const SimpleMembersList: React.FC<SimpleMembersListProps> = ({
  members,
  onSelectMember,
  selectedMemberId,
  className = '',
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Memoize filtered and sorted members for better performance
  const filteredMembers = useMemo(() => {
    // Filter by search term
    let filtered = [...members];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(member => {
        const name = member.fullName || member.name || member.displayName || '';
        const email = member.email || '';
        const phone = member.phoneNumber || member.phone || member.waNumber || '';
        
        return (
          name.toLowerCase().includes(term) ||
          email.toLowerCase().includes(term) ||
          phone.includes(term)
        );
      });
    }
    
    // Sort by last message timestamp if available
    return [...filtered].sort((a, b) => {
      // First priority: sort by last message timestamp (if available)
      if (a.lastMessageTimestamp && b.lastMessageTimestamp) {
        return b.lastMessageTimestamp - a.lastMessageTimestamp;
      } else if (a.lastMessageTimestamp) {
        return -1; // a has timestamp, b doesn't, so a comes first
      } else if (b.lastMessageTimestamp) {
        return 1;  // b has timestamp, a doesn't, so b comes first
      }
      
      // Second priority: sort by name
      const nameA = (a.fullName || a.name || a.displayName || '').toLowerCase();
      const nameB = (b.fullName || b.name || b.displayName || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [searchTerm, members]);

  // Helper function to get the display name
  const getDisplayName = (member: Member): string => {
    return member.fullName || member.name || member.displayName || 'Unknown Member';
  };

  // Helper function to get the phone number
  const getPhoneNumber = (member: Member): string => {
    return member.phoneNumber || member.phone || member.waNumber || '';
  };

  // Helper function to get role icon
  const RoleIcon = ({ role }: { role?: string }) => {
    switch (role?.toLowerCase()) {
      case 'admin':
      case 'commu_leader':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'user':
        return null; // Don't show icon for regular users
      default:
        return null;
    }
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return '';
    return format(new Date(timestamp * 1000), "HH:mm • dd/MMM/yyyy");
  };

  return (
    <div className={`${styles.container} ${className}`}>      
      <div className={styles.searchWrapper}>
        <div className={styles.searchInputWrapper}>
          <input
            type="text"
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <Search className={styles.searchIcon} size={16} />
        </div>
      </div>
      
      <div className={styles.membersList}>
        {isLoading ? (
          <div className={styles.loadingState}>
            <p>Loading members...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No members found matching your search.</p>
          </div>
        ) : (
          filteredMembers.map(member => (
            <div 
              key={member.id} 
              className={`${styles.memberItem} ${selectedMemberId === member.id ? styles.active : ''}`}
              onClick={() => onSelectMember(member)}
            >
              <div className={styles.memberAvatar}>
                <Avatar className={styles.avatar}>
                  {member.profileImage ? (
                    <AvatarImage src={member.profileImage} alt={getDisplayName(member)} />
                  ) : (
                    <AvatarFallback>{getDisplayName(member).charAt(0).toUpperCase()}</AvatarFallback>
                  )}
                </Avatar>
              </div>
              
              <div className={styles.memberInfo}>
                <div className={styles.nameSection}>
                  <div className={styles.nameWithIcon}>
                    <h3 className={styles.memberName}>{getDisplayName(member)}</h3>
                    <RoleIcon role={member.role} />
                  </div>
                  <span className={styles.phoneNumber}>
                    {getPhoneNumber(member)}
                  </span>
                </div>
              </div>
              
              {member.lastMessageTimestamp && (
                <span className={styles.messageTime}>
                  {formatTimestamp(member.lastMessageTimestamp)}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SimpleMembersList;
