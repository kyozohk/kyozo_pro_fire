'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import styles from '../../Dashboard.module.scss';
import { UserPlus, Loader2, ServerCrash } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit, DocumentData } from 'firebase/firestore';
import { CommunityMembersList } from '@/components/dashboard';

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

  // We don't need these helper functions anymore as they're handled by the CommunityMembersList component

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

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-8 bg-card-bg rounded-lg">
          <Loader2 className="h-12 w-12 animate-spin text-accent-pink mb-4" />
          <p className="text-text-secondary">Loading members...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-8 bg-card-bg rounded-lg">
          <ServerCrash className="h-12 w-12 text-destructive mb-4" />
          <p className="font-medium text-destructive">An Error Occurred</p>
          <p className="text-sm font-mono bg-destructive/10 p-2 rounded-md mt-2">{error.message}</p>
        </div>
      ) : (
        <CommunityMembersList
          members={filteredMembers}
          defaultSortField="name"
          defaultViewMode="list"
          onEdit={(member) => console.log('Edit member:', member)}
          onMessage={(member) => console.log('Message member:', member)}
          onCall={(member) => console.log('Call member:', member)}
          onEmail={(member) => console.log('Email member:', member)}
          onDelete={(member) => console.log('Delete member:', member)}
        />
      )}
    </div>
  );
};

export default MembersPage;
