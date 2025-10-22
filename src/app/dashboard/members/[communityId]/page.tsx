'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import styles from '../../Dashboard.module.scss';
import { Search, UserPlus, Mail, MoreHorizontal, UserX, Loader2, ServerCrash } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit, DocumentData } from 'firebase/firestore';

interface Member extends DocumentData {
  id: string;
  fullName?: string;
  name?: string; // Fallback if fullName doesn't exist
  email?: string;
  phoneNumber?: string;
  profileImage?: string;
  joinDate?: any;
  lastActive?: any;
  role?: string;
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

interface Community extends DocumentData {
  id: string;
  name: string;
}

const MembersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('fullName');
  const params = useParams();
  const communityId = params?.communityId as string;
  const firestore = useFirestore();

  // Query for the specific community to get its details
  const communityQuery = useMemoFirebase(() => {
    if (!firestore || !communityId) return null;
    return query(collection(firestore, 'communities'), where('id', '==', communityId));
  }, [firestore, communityId]);
  
  const { data: communityData, isLoading: loadingCommunity, error: communityError } = useCollection<Community>(communityQuery);

  // Query for users who are members of this community
  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !communityId) return null;
    
    console.log(`Querying users for community ID: ${communityId}`);
    // There are two ways users might be associated with communities:
    // 1. Through a communityMemberships array that contains community IDs
    // 2. Through a direct communities array field
    return query(
      collection(firestore, 'users'),
      where('communities', 'array-contains', communityId)
    );
  }, [firestore, communityId]);

  const { data: users, isLoading: loadingUsers, error: usersError } = useCollection<Member>(usersQuery);

  // Alternative query for users with communityMemberships structure
  // We need to use a different approach since array-contains needs to match the entire object
  const usersMembershipQuery = useMemoFirebase(() => {
    if (!firestore || !communityId) return null;
    
    console.log(`Querying users with communityMemberships for community ID: ${communityId}`);
    // Get all users and filter them client-side based on communityMemberships
    // This is not ideal for large collections but ensures we don't miss any users
    return collection(firestore, 'users');
  }, [firestore, communityId]);

  const { data: usersMembership, isLoading: loadingUsersMembership, error: usersMembershipError } = useCollection<Member>(usersMembershipQuery);

  // Debug information
  useEffect(() => {
    if (users) {
      console.log(`Found ${users.length} users with direct communities array`);
    }
    if (usersMembership) {
      console.log(`Found ${usersMembership.length} total users to filter for communityMemberships`);
      
      // Log the structure of the first few users to understand the data format
      if (usersMembership.length > 0) {
        const sampleUser = usersMembership[0];
        console.log('Sample user structure:', {
          id: sampleUser.id,
          name: sampleUser.fullName || sampleUser.name,
          communityMemberships: sampleUser.communityMemberships
        });
      }
    }
  }, [users, usersMembership]);

  // Combine results from both queries
  const allMembers = useMemo(() => {
    const members = new Map<string, Member>();
    
    // Add users from direct communities array
    if (users) {
      users.forEach(user => {
        members.set(user.id, user);
      });
    }
    
    // Add users from communityMemberships array - filter client-side
    if (usersMembership) {
      usersMembership.forEach(user => {
        // Check if this user has the current communityId in their communityMemberships
        let hasCommunityMembership = false;
        
        if (Array.isArray(user.communityMemberships)) {
          // Check each membership in the array
          hasCommunityMembership = user.communityMemberships.some(membership => {
            // If membership is an object with a community property
            if (typeof membership === 'object' && membership !== null) {
              return (membership as any).community === communityId;
            }
            // If membership is a string, check direct equality
            return membership === communityId;
          });
        } else if (typeof user.communityMemberships === 'object' && user.communityMemberships !== null) {
          // If communityMemberships is an object (not an array), check if it has the communityId as a key
          hasCommunityMembership = Object.values(user.communityMemberships).some(value => {
            if (typeof value === 'object' && value !== null) {
              // Use safer property access with type checking
              return (value as any).community === communityId;
            }
            return value === communityId;
          });
        }
        
        // Debug individual user membership check
        if (user.communityMemberships) {
          console.log(`User ${user.id} (${user.fullName || user.name || 'Unknown'}): communityMembership check = ${hasCommunityMembership}`);
        }

        // Only add the user if they have a membership for this community
        // and they haven't been added already
        if (hasCommunityMembership && !members.has(user.id)) {
          members.set(user.id, user);
        }
      });
    }
    
    return Array.from(members.values());
  }, [users, usersMembership]);

  // Sort members based on selected sort field
  // Debug the final members count
  useEffect(() => {
    if (allMembers) {
      console.log(`Final members count: ${allMembers.length}`);
    }
  }, [allMembers]);

  const sortedMembers = useMemo(() => {
    if (!allMembers) return [];
    
    return [...allMembers].sort((a, b) => {
      if (sortBy === 'fullName' || sortBy === 'name') {
        const nameA = a.fullName || a.name || '';
        const nameB = b.fullName || b.name || '';
        return nameA.localeCompare(nameB);
      } else if (sortBy === 'role') {
        const roleA = a.role || '';
        const roleB = b.role || '';
        return roleA.localeCompare(roleB);
      } else if (sortBy === 'joinDate') {
        const dateA = a.joinDate?.seconds || 0;
        const dateB = b.joinDate?.seconds || 0;
        return dateB - dateA; // Most recent first
      } else if (sortBy === 'lastActive') {
        const dateA = a.lastActive?.seconds || 0;
        const dateB = b.lastActive?.seconds || 0;
        return dateB - dateA; // Most recent first
      }
      return 0;
    });
  }, [allMembers, sortBy]);

  // Filter members based on search
  const filteredMembers = useMemo(() => {
    if (!sortedMembers) return [];
    
    return sortedMembers.filter(member => {
      const name = member.fullName || member.name || '';
      const email = member.email || '';
      const phone = member.phoneNumber || member.participation?.phoneNumber || member.waNumber || member.phone || '';
      
      const searchLower = searchQuery.toLowerCase();
      return name.toLowerCase().includes(searchLower) || 
             email.toLowerCase().includes(searchLower) ||
             phone.toLowerCase().includes(searchLower);
    });
  }, [sortedMembers, searchQuery]);

  // Helper function to get the display name
  const getDisplayName = (member: Member) => {
    return member.fullName || member.name || 'Unknown User';
  };

  // Helper function to get the email or phone
  const getContactInfo = (member: Member) => {
    if (member.email) return member.email;
    return member.phoneNumber || member.participation?.phoneNumber || member.waNumber || member.phone || 'No contact info';
  };

  const isLoading = loadingCommunity || loadingUsers || loadingUsersMembership;
  const error = communityError || usersError || usersMembershipError;

  return (
    <div className={styles.dashboardContent}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Members</h1>
          <p className={styles.subtitle}>
            {communityData && communityData.length > 0 ? `Community: ${communityData[0].name}` : 'Manage community members'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 bg-accent-pink text-white rounded-md flex items-center gap-2">
            <UserPlus size={16} />
            Invite Member
          </button>
        </div>
      </div>

      <div className="bg-card-bg rounded-lg overflow-hidden">
        {/* Search and filters */}
        <div className="p-4 border-b border-border flex flex-wrap gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder="Search members..."
              className="w-full bg-background rounded-md py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent-pink"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-text-secondary">Sort by:</label>
            <select 
              className="bg-background border border-border rounded-md py-1 px-2 text-sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="fullName">Name</option>
              <option value="role">Role</option>
              <option value="joinDate">Join Date</option>
              <option value="lastActive">Last Active</option>
            </select>
          </div>
        </div>
        
        {/* Members list */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-background text-left">
                <th className="px-4 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <Loader2 className="h-8 w-8 animate-spin text-accent-pink" />
                      <p className="text-text-secondary">Loading members...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8">
                    <div className="flex flex-col items-center justify-center gap-4 text-destructive">
                      <ServerCrash className="h-8 w-8" />
                      <p className="font-medium">An Error Occurred</p>
                      <p className="text-sm font-mono bg-destructive/10 p-2 rounded-md">{error.message}</p>
                    </div>
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-text-secondary">
                    {searchQuery ? 'No members found matching your search' : 'No members found in this community'}
                  </td>
                </tr>
              ) : (
                filteredMembers.map(member => (
                  <tr key={member.id} className="border-t border-border hover:bg-background/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                          {member.profileImage ? (
                            <img src={member.profileImage} alt={getDisplayName(member)} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <span className="text-white">{getDisplayName(member).charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{getDisplayName(member)}</p>
                          <p className="text-xs text-text-secondary">{member.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs rounded-full bg-accent-pink/10 text-accent-pink">
                        {member.role || 'Member'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {getContactInfo(member)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button className="p-1 rounded-md hover:bg-background">
                          <Mail size={16} className="text-text-secondary" />
                        </button>
                        <button className="p-1 rounded-md hover:bg-background">
                          <UserX size={16} className="text-text-secondary" />
                        </button>
                        <button className="p-1 rounded-md hover:bg-background">
                          <MoreHorizontal size={16} className="text-text-secondary" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MembersPage;
