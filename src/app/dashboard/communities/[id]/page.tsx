'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { CommunityHeader, MembersList, Loading } from '@/components/dashboard';
import styles from '../communities.module.scss';

interface CommunityDetailPageProps {
  params: {
    id: string;
  };
}

const CommunityDetailPage = () => {
  const params = useParams();
  const communityId = params.id as string;
  const [community, setCommunity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const firestore = useFirestore();

  useEffect(() => {
    const fetchCommunity = async () => {
      if (!firestore || !communityId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const communityDoc = await getDoc(doc(firestore, 'communities', communityId));
        
        if (communityDoc.exists()) {
          setCommunity({ id: communityDoc.id, ...communityDoc.data() });
        } else {
          setError('Community not found');
        }
      } catch (err) {
        console.error('Error fetching community:', err);
        setError('Failed to load community details');
      } finally {
        setLoading(false);
      }
    };

    fetchCommunity();
  }, [firestore, communityId]);

  if (loading) {
    return <Loading message="Loading community details..." />;
  }

  if (error || !community) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-500">Error</h2>
        <p className="mt-2">{error || 'Community not found'}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <CommunityHeader
        communityName={community.name}
        communityId={community.id}
        description={community.description}
        showBreadcrumbs={true}
        showActions={true}
      />

      <div className="mt-8">
        <Suspense fallback={<Loading message="Loading members..." />}>
          <MembersList
            communityId={community.id}
            title={`${community.name} Members`}
            pageSize={10}
          />
        </Suspense>
      </div>
    </div>
  );
};

export default CommunityDetailPage;
