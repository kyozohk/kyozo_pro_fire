'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, DocumentData } from 'firebase/firestore';
import { EnhancedMembersList, CommunityPageLayout } from '@/components/dashboard';
import styles from './MembersPage.module.scss';

interface Member extends DocumentData {
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

export default function MembersPage() {
  const params = useParams();
  const communityId = params.communityId as string;
  const firestore = useFirestore();
  
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Query for members
  const membersQuery = useMemoFirebase(() => {
    if (!firestore || !communityId) return null;
    return query(
      collection(firestore, 'users'),
      where('communities', 'array-contains', communityId)
    );
  }, [firestore, communityId]);
  
  const { data: membersData, isLoading, error: membersError } = useCollection<Member>(membersQuery);
  
  useEffect(() => {
    if (membersData) {
      setMembers(membersData);
      setLoading(false);
    }
    
    if (membersError) {
      setError(membersError.message);
      setLoading(false);
    }
  }, [membersData, membersError]);
  
  // Handle member actions
  const handleEdit = (member: Member) => {
    console.log('Edit member:', member);
  };
  
  const handleMessage = (member: Member) => {
    console.log('Message member:', member);
  };
  
  const handleCall = (member: Member) => {
    console.log('Call member:', member);
  };
  
  const handleEmail = (member: Member) => {
    console.log('Email member:', member);
  };
  
  const handleDelete = (member: Member) => {
    console.log('Delete member:', member);
  };
  
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading members...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>Error: {error}</p>
      </div>
    );
  }
  
  return (
    <CommunityPageLayout>
      <div className={styles.membersPage}>
        <EnhancedMembersList
          members={members}
          onEdit={handleEdit}
          onMessage={handleMessage}
          onCall={handleCall}
          onEmail={handleEmail}
          onDelete={handleDelete}
          onInvite={() => console.log('Invite member clicked')}
        />
      </div>
    </CommunityPageLayout>
  );
}
