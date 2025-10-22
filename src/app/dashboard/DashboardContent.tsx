'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardCard from './DashboardCard';
import { useFirestore, useCollection, useMemoFirebase, useAuth } from '@/firebase';
import { collection, query, where, DocumentData } from 'firebase/firestore';
import type { WithId } from '@/firebase/firestore/use-collection';
import styles from './Dashboard.module.scss';

// Import custom components
import { CommunityList, Loading } from '@/components/dashboard';

// Import icons from Lucide React instead of react-icons/hi2
import { 
  Users as HiUsers, 
  MessageSquare as HiChatBubbleLeftRight, 
  Building2 as HiBuildingOffice2, 
  TrendingUp as HiArrowTrendingUp, 
  Plus as HiPlus,
  Globe as HiGlobeAlt,
  Lock as HiLockClosed
} from 'lucide-react';

// --- TYPES ---
interface Community extends DocumentData {
  id: string;
  name: string;
  communityProfileImage?: string;
  description?: string;
  isPublic?: boolean;
  memberCount?: number;
  slug?: string;
  logoURL?: string;
}

interface Message extends DocumentData {
  id: string;
  text: string;
  createdAt: any;
  community: string;
  sender?: string;
  readBy?: { userId: string; text: string }[];
}

interface DashboardContentProps {
  stats?: any;
}

const DashboardContent: React.FC<DashboardContentProps> = ({ stats: initialStats }) => {
  const auth = useAuth();
  const router = useRouter();
  const firestore = useFirestore();
  const [stats, setStats] = useState<any>(initialStats || {
    totalCommunities: 0,
    totalMembers: 0,
    totalMessages: 0,
    growthRate: 0,
    monthlyGrowth: {
      communities: 0,
      members: 0,
      messages: 0
    },
    growthRateChange: 0
  });
  
  // Use the same query pattern as in app/page.tsx
  const communitiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'communities'), where('name', '!=', ''));
  }, [firestore]);
  const { data: communitiesData, isLoading: loadingCommunities, error: communitiesError } = useCollection<Community>(communitiesQuery);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'messages');
  }, [firestore]);
  const { data: allMessages, isLoading: loadingMessages, error: messagesError } = useCollection<Message>(messagesQuery);

  const sentMessagesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'sendwamessagehistories');
  }, [firestore]);
  const { data: allSentMessages, isLoading: loadingSentMessages, error: sentMessagesError } = useCollection<Message>(sentMessagesQuery);
  
  // Calculate stats based on the loaded data
  useEffect(() => {
    if (!communitiesData || !allMessages || !allSentMessages) return;
    
    try {
      // Calculate total messages (received + sent)
      const totalMessages = (allMessages?.length || 0) + (allSentMessages?.length || 0);
      
      // Calculate total members across all communities
      const totalMembers = communitiesData.reduce((sum: number, community: Community) => sum + (community.memberCount || 0), 0);
      
      // Update stats
      setStats({
        totalCommunities: communitiesData.length,
        totalMembers: totalMembers,
        totalMessages: totalMessages,
        growthRate: 5, // Placeholder - would need historical data to calculate
        monthlyGrowth: {
          communities: Math.floor(communitiesData.length * 0.1), // Placeholder - 10% growth
          members: Math.floor(totalMembers * 0.15), // Placeholder - 15% growth
          messages: Math.floor(totalMessages * 0.25) // Placeholder - 25% growth
        },
        growthRateChange: 2 // Placeholder
      });
    } catch (err) {
      console.error('Error calculating dashboard stats:', err);
    }
  }, [communitiesData, allMessages, allSentMessages]);

  const isLoading = loadingCommunities || loadingMessages || loadingSentMessages;
  const errorMessage = communitiesError?.message || messagesError?.message || sentMessagesError?.message;

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className="animate-spin text-accent-purple text-4xl">⟳</div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className={styles.errorContainer}>
        <h2>Error</h2>
        <p>{errorMessage}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContent}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>
            Welcome back, {auth.currentUser?.displayName || 'User'}
          </p>
        </div>
        <div className={styles.actions}>
          <button 
            className={styles.createButton}
            onClick={() => router.push('/dashboard/communities/new')}
          >
            <HiPlus size={20} />
            New Community
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsSection}>
        <h2 className={styles.sectionTitle}>Overview</h2>
        <div className={styles.statsGrid}>
          <DashboardCard
            title="Communities"
            value={stats?.totalCommunities || communitiesData?.length || 0}
            icon={<HiBuildingOffice2 className={styles.cardIcon} />}
            trend={stats?.monthlyGrowth?.communities || 0}
            trendLabel="this month"
          />
          <DashboardCard
            title="Members"
            value={stats?.totalMembers || 0}
            icon={<HiUsers className={styles.cardIcon} />}
            trend={stats?.monthlyGrowth?.members || 0}
            trendLabel="this month"
          />
          <DashboardCard
            title="Messages"
            value={stats?.totalMessages || 0}
            icon={<HiChatBubbleLeftRight className={styles.cardIcon} />}
            trend={stats?.monthlyGrowth?.messages || 0}
            trendLabel="this month"
          />
          <DashboardCard
            title="Growth"
            value={`${stats?.growthRate || 0}%`}
            icon={<HiArrowTrendingUp className={styles.cardIcon} />}
            trend={stats?.growthRateChange || 0}
            trendLabel="vs last month"
          />
        </div>
      </div>

      {/* Communities Section */}
      <div className={styles.communitiesSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Your Communities</h2>
          <Link href="/dashboard/communities" className={styles.viewAllLink}>
            View All
          </Link>
        </div>
        
        <Suspense fallback={<Loading message="Loading communities..." />}>
          <CommunityList 
            defaultView="card" 
            title="" 
            showViewToggle={false} 
            maxItems={4} 
            linkPrefix="/dashboard/communities"
          />
        </Suspense>
      </div>
    </div>
  );
};

export default DashboardContent;
