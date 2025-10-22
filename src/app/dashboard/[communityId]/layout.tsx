'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, getDoc, query, where, DocumentData } from 'firebase/firestore';
import CommunityBanner from '@/components/dashboard/CommunityBanner';
import styles from './CommunityLayout.module.scss';

interface Community extends DocumentData {
  id: string;
  name: string;
  description?: string;
  bannerURL?: string;
  logoURL?: string;
  isPublic?: boolean;
  location?: string;
  category?: string;
  memberCount?: number;
}

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const communityId = params.communityId as string;
  const firestore = useFirestore();
  
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Query for community data
  const communityQuery = useMemoFirebase(() => {
    if (!firestore || !communityId) return null;
    return doc(firestore, 'communities', communityId);
  }, [firestore, communityId]);
  
  // Query for members count
  const membersQuery = useMemoFirebase(() => {
    if (!firestore || !communityId) return null;
    return query(
      collection(firestore, 'users'),
      where('communities', 'array-contains', communityId)
    );
  }, [firestore, communityId]);
  
  const { data: members } = useCollection(membersQuery);
  
  // Fetch community data
  useEffect(() => {
    const fetchCommunityData = async () => {
      if (!firestore || !communityId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Use direct document reference instead of the memo
        const communityDocRef = doc(firestore, 'communities', communityId);
        const communityDoc = await getDoc(communityDocRef);
        
        if (communityDoc.exists()) {
          const communityData = communityDoc.data() as Community;
          setCommunity({
            ...communityData,
            id: communityDoc.id,
          });
        } else {
          setError('Community not found');
        }
      } catch (err) {
        console.error('Error fetching community data:', err);
        setError('Failed to load community data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCommunityData();
  }, [firestore, communityId]);
  
  // Handle actions
  const handleEditProfile = () => {
    console.log('Edit profile clicked');
  };
  
  const handleAddMembers = () => {
    console.log('Add members clicked');
  };
  
  const handleInvite = () => {
    console.log('Invite clicked');
  };
  
  const handleBroadcast = () => {
    console.log('Broadcast clicked');
  };
  
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading community...</p>
      </div>
    );
  }
  
  if (error || !community) {
    return (
      <div className={styles.errorContainer}>
        <p>{error || 'Community not found'}</p>
      </div>
    );
  }
  
  return (
    <div className={styles.communityLayout}>
      <CommunityBanner
        communityId={communityId}
        communityName={community.name}
        communityDescription={community.description}
        memberCount={members?.length || 0}
        location={community.location}
        category={community.category}
        isPublic={community.isPublic}
        bannerURL={community.bannerURL}
        logoURL={community.logoURL}
        onEditProfile={handleEditProfile}
        onAddMembers={handleAddMembers}
        onInvite={handleInvite}
        onBroadcast={handleBroadcast}
      />
      <div className={styles.communityContent}>
        {children}
      </div>
    </div>
  );
}
