'use client';

import React, { useState, useEffect } from 'react';
import { Search, Pencil, MessageSquare, Phone, Mail, Trash, LayoutGrid, LayoutList, Crown, UserPlus } from 'lucide-react';
import { ButtonV2 } from '@/components/ui';
import { EnhancedSelect } from '@/components/ui';
import styles from './EnhancedMembersList.module.scss';

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

interface EnhancedMembersListProps {
  members: Member[];
  onEdit?: (member: Member) => void;
  onMessage?: (member: Member) => void;
  onCall?: (member: Member) => void;
  onEmail?: (member: Member) => void;
  onDelete?: (member: Member) => void;
  className?: string;
  defaultSortField?: 'name' | 'role' | 'phone';
  defaultViewMode?: 'list' | 'grid';
}

const sortOptions = [
  { value: 'name', label: 'Name' },
  { value: 'role', label: 'Role' },
  { value: 'phone', label: 'Phone' }
];

const EnhancedMembersList: React.FC<EnhancedMembersListProps> = ({
  members,
  onEdit,
  onMessage,
  onCall,
  onEmail,
  onDelete,
  className = '',
  defaultSortField = 'name',
  defaultViewMode = 'list'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>(defaultSortField);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(defaultViewMode);
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

  const handleSortChange = (value: string) => {
    setSortField(value);
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.header}>
        <h1 className={styles.title}>Members</h1>
        <p className={styles.subtitle}>Manage community members</p>
      </div>
      
      <div className={styles.controlsWrapper}>
        <div className={styles.searchAndInvite}>
          <div className={styles.searchWrapper}>
            <div className={styles.searchInputWrapper}>
              <input
                type="text"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
              <Search className={styles.searchIcon} size={18} />
            </div>
          </div>
        </div>
        
        <div className={styles.controlsRight}>
          <div className={styles.sortWrapper}>
            <EnhancedSelect
              options={sortOptions}
              value={sortField}
              onChange={handleSortChange}
              placeholder="Sort by"
              className={styles.sortSelect}
            />
          </div>
          
          <div className={styles.viewToggle}>
            <button
              onClick={() => setViewMode('list')}
              className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
              title="List view"
            >
              <LayoutList size={20} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`${styles.viewButton} ${viewMode === 'grid' ? styles.active : ''}`}
              title="Grid view"
            >
              <LayoutGrid size={20} />
            </button>
          </div>
        </div>
      </div>
      
      {viewMode === 'list' ? (
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
                    <div className={styles.nameWithIcon}>
                      <h3 className={styles.memberName}>{getDisplayName(member)}</h3>
                      {member.role?.toLowerCase().includes('admin') && (
                        <Crown size={16} className={styles.crownIcon} />
                      )}
                    </div>
                    <span className={styles.memberRole}>
                      {getRoleDisplay(member.role)}
                    </span>
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
      ) : (
        <div className={styles.membersGrid}>
          {filteredMembers.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No members found matching your search.</p>
            </div>
          ) : (
            filteredMembers.map(member => (
              <div key={member.id} className={styles.memberCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardAvatar}>
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
                  
                  <div className={styles.cardNameSection}>
                    <div className={styles.nameWithIcon}>
                      <h3 className={styles.memberName}>{getDisplayName(member)}</h3>
                      {member.role?.toLowerCase().includes('admin') && (
                        <Crown size={16} className={styles.crownIcon} />
                      )}
                    </div>
                    <span className={styles.memberRole}>
                      {getRoleDisplay(member.role)}
                    </span>
                  </div>
                </div>
                
                <div className={styles.cardContent}>
                  {member.email && (
                    <div className={styles.cardContactItem}>
                      <Mail size={14} className={styles.contactIcon} />
                      <span>{member.email}</span>
                    </div>
                  )}
                  
                  {getPhoneNumber(member) && (
                    <div className={styles.cardContactItem}>
                      <Phone size={14} className={styles.contactIcon} />
                      <span>{getPhoneNumber(member)}</span>
                    </div>
                  )}
                </div>
                
                <div className={styles.cardActions}>
                  {onEdit && (
                    <button 
                      onClick={() => onEdit(member)} 
                      className={styles.cardActionButton}
                      title="Edit Member"
                    >
                      <Pencil size={16} />
                    </button>
                  )}
                  
                  {onMessage && (
                    <button 
                      onClick={() => onMessage(member)} 
                      className={styles.cardActionButton}
                      title="Message"
                    >
                      <MessageSquare size={16} />
                    </button>
                  )}
                  
                  {onCall && getPhoneNumber(member) && (
                    <button 
                      onClick={() => onCall(member)} 
                      className={styles.cardActionButton}
                      title="Call"
                    >
                      <Phone size={16} />
                    </button>
                  )}
                  
                  {onEmail && member.email && (
                    <button 
                      onClick={() => onEmail(member)} 
                      className={styles.cardActionButton}
                      title="Email"
                    >
                      <Mail size={16} />
                    </button>
                  )}
                  
                  {onDelete && (
                    <button 
                      onClick={() => onDelete(member)} 
                      className={styles.cardActionButton}
                      title="Delete"
                    >
                      <Trash size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedMembersList;
