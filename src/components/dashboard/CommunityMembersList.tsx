'use client';

import React, { useState, useEffect } from 'react';
import { Search, Pencil, MessageSquare, Phone, Mail, Trash } from 'lucide-react';
import styles from './CommunityMembersList.module.scss';

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
}

interface CommunityMembersListProps {
  members: Member[];
  onEdit?: (member: Member) => void;
  onMessage?: (member: Member) => void;
  onCall?: (member: Member) => void;
  onEmail?: (member: Member) => void;
  onDelete?: (member: Member) => void;
  className?: string;
  defaultSortField?: 'name' | 'role' | 'phone';
}

const CommunityMembersList: React.FC<CommunityMembersListProps> = ({
  members,
  onEdit,
  onMessage,
  onCall,
  onEmail,
  onDelete,
  className = '',
  defaultSortField = 'name'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'name' | 'role' | 'phone'>(defaultSortField);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>(members);

  useEffect(() => {
    // First filter by search term
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
    
    // Then sort the filtered results
    filtered.sort((a, b) => {
      if (sortField === 'name') {
        const nameA = (a.fullName || a.name || a.displayName || '').toLowerCase();
        const nameB = (b.fullName || b.name || b.displayName || '').toLowerCase();
        return nameA.localeCompare(nameB);
      } else if (sortField === 'role') {
        const roleA = (a.role || 'member').toLowerCase();
        const roleB = (b.role || 'member').toLowerCase();
        return roleA.localeCompare(roleB);
      } else if (sortField === 'phone') {
        const phoneA = a.phoneNumber || a.phone || a.waNumber || '';
        const phoneB = b.phoneNumber || b.phone || b.waNumber || '';
        return phoneA.localeCompare(phoneB);
      }
      return 0;
    });
    
    setFilteredMembers(filtered);
  }, [searchTerm, members, sortField]);

  // Helper function to get the display name
  const getDisplayName = (member: Member): string => {
    return member.fullName || member.name || member.displayName || 'Unknown Member';
  };

  // Helper function to get the phone number
  const getPhoneNumber = (member: Member): string => {
    return member.phoneNumber || member.phone || member.waNumber || '';
  };

  // Helper function to get the role display
  const getRoleDisplay = (role?: string): string => {
    if (!role) return 'Member';
    
    const roleLower = role.toLowerCase();
    if (roleLower.includes('admin')) return 'Admin';
    if (roleLower.includes('mod')) return 'Moderator';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.controlsWrapper}>
        <div className={styles.searchWrapper}>
          <input
            type="text"
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <Search className={styles.searchIcon} size={20} />
        </div>
        
        <div className={styles.sortWrapper}>
          <label className={styles.sortLabel}>Sort by:</label>
          <select 
            value={sortField}
            onChange={(e) => setSortField(e.target.value as 'name' | 'role' | 'phone')}
            className={styles.sortSelect}
          >
            <option value="name">Name</option>
            <option value="role">Role</option>
            <option value="phone">Phone</option>
          </select>
        </div>
      </div>
      
      <div className={styles.membersList}>
        {filteredMembers.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No members found matching your search.</p>
          </div>
        ) : (
          filteredMembers.map(member => (
            <div key={member.id} className={styles.memberItem}>
              <div className={styles.memberAvatar}>
                {member.profileImage ? (
                  <img 
                    src={member.profileImage} 
                    alt={getDisplayName(member)} 
                    className={styles.avatarImage}
                  />
                ) : (
                  <div className={styles.avatarFallback}>
                    {getDisplayName(member).charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              <div className={styles.memberInfo}>
                <div className={styles.nameSection}>
                  <h3 className={styles.memberName}>{getDisplayName(member)}</h3>
                  <span className={styles.memberRole}>Member</span>
                </div>
                <div className={styles.phoneNumber}>
                  {getPhoneNumber(member)}
                </div>
              </div>
              
              <div className={styles.memberActions}>
                {onEdit && (
                  <button 
                    onClick={() => onEdit(member)} 
                    className={styles.actionButton}
                    title="Edit Member"
                  >
                    <Pencil size={18} />
                  </button>
                )}
                
                {onMessage && (
                  <button 
                    onClick={() => onMessage(member)} 
                    className={styles.actionButton}
                    title="Message"
                  >
                    <MessageSquare size={18} />
                  </button>
                )}
                
                {onCall && getPhoneNumber(member) && (
                  <button 
                    onClick={() => onCall(member)} 
                    className={styles.actionButton}
                    title="Call"
                  >
                    <Phone size={18} />
                  </button>
                )}
                
                {onEmail && member.email && (
                  <button 
                    onClick={() => onEmail(member)} 
                    className={styles.actionButton}
                    title="Email"
                  >
                    <Mail size={18} />
                  </button>
                )}
                
                {onDelete && (
                  <button 
                    onClick={() => onDelete(member)} 
                    className={styles.actionButton}
                    title="Delete"
                  >
                    <Trash size={18} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommunityMembersList;
