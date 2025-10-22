'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, DocumentData } from 'firebase/firestore';
import { UserPlus, Loader2, ServerCrash } from 'lucide-react';
import { CommunityMembersList } from '@/components/dashboard';
import styles from '../Dashboard.module.scss';

interface Member extends DocumentData {
  id: string;
  fullName?: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  profileImage?: string;
  role?: string;
  // Add any other fields you need
}

interface Community extends DocumentData {
  id: string;
  name: string;
}

const MembersPageWithNewComponent: React.FC = () => {
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
    return query(
      collection(firestore, 'users'),
      where('communities', 'array-contains', communityId)
    );
  }, [firestore, communityId]);

  const { data: users, isLoading: loadingUsers, error: usersError } = useCollection<Member>(usersQuery);

  // Alternative query for users with communityMemberships structure
  const usersMembershipQuery = useMemoFirebase(() => {
    if (!firestore || !communityId) return null;
    return collection(firestore, 'users');
  }, [firestore, communityId]);

  const { data: usersMembership, isLoading: loadingUsersMembership, error: usersMembershipError } = useCollection<Member>(usersMembershipQuery);

  // Filter and combine members
  const allMembers = React.useMemo(() => {
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
        }

        // Only add the user if they have a membership for this community
        // and they haven't been added already
        if (hasCommunityMembership && !members.has(user.id)) {
          members.set(user.id, user);
        }
      });
    }
    
    return Array.from(members.values());
  }, [users, usersMembership, communityId]);

  const isLoading = loadingCommunity || loadingUsers || loadingUsersMembership;
  const error = communityError || usersError || usersMembershipError;

  // Event handlers
  const handleEdit = (member: Member) => {
    console.log('Edit member:', member);
    // Implement your edit logic here
  };

  const handleMessage = (member: Member) => {
    console.log('Message member:', member);
    // Implement your messaging logic here
  };

  const handleCall = (member: Member) => {
    console.log('Call member:', member);
    // Implement your call logic here
  };

  const handleEmail = (member: Member) => {
    console.log('Email member:', member);
    // Implement your email logic here
  };

  const handleDelete = (member: Member) => {
    console.log('Delete member:', member);
    // Implement your delete logic here
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground p-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg font-medium">Loading members...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-destructive p-8">
        <ServerCrash className="h-12 w-12" />
        <p className="text-lg font-medium">An Error Occurred</p>
        <p className="text-sm font-mono bg-destructive/10 p-2 rounded-md">{error.message}</p>
      </div>
    );
  }

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

      {/* Use the new CommunityMembersList component */}
      <CommunityMembersList
        members={allMembers}
        onEdit={handleEdit}
        onMessage={handleMessage}
        onCall={handleCall}
        onEmail={handleEmail}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default MembersPageWithNewComponent;
