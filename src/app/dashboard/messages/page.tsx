'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../Dashboard.module.scss';
import { MessageSquare, Search, Loader2, ServerCrash } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, DocumentData } from 'firebase/firestore';
import Image from 'next/image';

// --- TYPES ---
interface Community extends DocumentData {
  id: string;
  name: string;
  communityProfileImage?: string;
  logoURL?: string;
  slug?: string;
}

// --- HELPER FUNCTIONS & COMPONENTS ---
function LoadingSpinner({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-text-secondary">
      <Loader2 className="h-12 w-12 animate-spin" />
      <p className="text-lg font-medium">{text}</p>
    </div>
  );
}

function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-destructive">
      <ServerCrash className="h-12 w-12" />
      <p className="text-lg font-medium">An Error Occurred</p>
      <p className="text-sm font-mono bg-destructive/10 p-2 rounded-md">{message}</p>
    </div>
  );
}

// --- MAIN MESSAGES PAGE ---
export default function MessagesPage() {
  const firestore = useFirestore();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Query for communities
  const communitiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'communities'), where('name', '!=', ''));
  }, [firestore]);
  const { data: communities, isLoading: loadingCommunities, error: communitiesError } = useCollection<Community>(communitiesQuery);

  // Sort communities by name
  const sortedCommunities = useMemo(() => {
    if (!communities) return [];
    return [...communities].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [communities]);

  // Filter communities based on search
  const filteredCommunities = useMemo(() => {
    if (!sortedCommunities) return [];
    return sortedCommunities.filter(community => 
      community.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sortedCommunities, searchQuery]);

  // Handle community selection
  const handleSelectCommunity = (communityId: string) => {
    router.push(`/dashboard/messages/${communityId}`);
  };

  return (
    <div className={styles.dashboardContent}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Messages</h1>
          <p className={styles.subtitle}>
            Select a community to view messages
          </p>
        </div>
      </div>

      <div className="bg-card-bg rounded-lg overflow-hidden p-4">
        <div className="mb-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder="Search communities..."
              className="w-full bg-background rounded-md py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent-pink"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loadingCommunities ? (
            <LoadingSpinner text="Loading communities..." />
          ) : communitiesError ? (
            <ErrorDisplay message={communitiesError.message} />
          ) : filteredCommunities.length === 0 ? (
            <div className="col-span-full text-center p-8 text-text-secondary">
              No communities found
            </div>
          ) : (
            filteredCommunities.map(community => (
              <div
                key={community.id}
                className="bg-background rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleSelectCommunity(community.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                    {community.communityProfileImage || community.logoURL ? (
                      <Image 
                        src={community.communityProfileImage || community.logoURL || ''} 
                        alt={community.name} 
                        width={48} 
                        height={48} 
                        className="rounded-full object-cover" 
                      />
                    ) : (
                      <span className="text-lg font-semibold text-white">
                        {community.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{community.name}</h3>
                    <p className="text-xs text-text-secondary">
                      Click to view messages
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
