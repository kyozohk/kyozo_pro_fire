'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import DashboardCard from './DashboardCard';
import { useFirestore, useCollection, useMemoFirebase, useAuth } from '@/firebase';
import { collection, query, where, orderBy, limit, DocumentData, Timestamp } from 'firebase/firestore';
import type { WithId } from '@/firebase/firestore/use-collection';
import styles from './Dashboard.module.scss';

// Import custom components
import { Loading } from '@/components/dashboard';

// Import icons from Lucide React
import { 
  Users, 
  MessageSquare, 
  Activity, 
  TrendingUp, 
  Bell,
  Calendar,
  UserPlus
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

interface Member extends DocumentData {
  id: string;
  name: string;
  email?: string;
  photoURL?: string;
  joinDate?: Timestamp;
  lastActive?: Timestamp;
}

interface UnreadMessage extends DocumentData {
  id: string;
  content: string;
  senderId: string;
  senderName?: string;
  timestamp: Timestamp;
  read: boolean;
}

interface DashboardContentProps {
  stats?: any;
}

const DashboardContent: React.FC<DashboardContentProps> = ({ stats: initialStats }) => {
  const auth = useAuth();
  const router = useRouter();
  const firestore = useFirestore();
  const params = useParams();
  const communitySlug = params?.slug as string;
  
  const [stats, setStats] = useState<any>(initialStats || {
    totalMembers: 0,
    activeMembers: 0,
    totalMessages: 0,
    unreadMessages: 0,
    growthRate: 0,
    newMembersThisMonth: 0,
    messagesSentThisMonth: 0
  });
  
  // Get selected community from URL slug
  const communityQuery = useMemoFirebase(() => {
    if (!firestore || !communitySlug) return null;
    return query(collection(firestore, 'communities'), where('slug', '==', communitySlug));
  }, [firestore, communitySlug]);
  
  const { data: communityData, isLoading: loadingCommunity, error: communityError } = useCollection<Community>(communityQuery);
  const selectedCommunity = communityData?.[0];
  
  // Update selectedCommunityId in parent layout when community is loaded from URL
  useEffect(() => {
    if (selectedCommunity && selectedCommunity.id) {
      // This is a workaround since we can't directly access the parent component's state
      // In a real app, you might use context or Redux for this
      const event = new CustomEvent('communitySelected', { detail: { id: selectedCommunity.id } });
      document.dispatchEvent(event);
    }
  }, [selectedCommunity]);
  
  // Get community members
  const membersQuery = useMemoFirebase(() => {
    if (!firestore || !selectedCommunity?.id) return null;
    return query(collection(firestore, 'users'), where('communities', 'array-contains', selectedCommunity.id));
  }, [firestore, selectedCommunity?.id]);
  
  const { data: members, isLoading: loadingMembers, error: membersError } = useCollection<Member>(membersQuery);
  
  // Get new members this month
  const newMembersQuery = useMemoFirebase(() => {
    if (!firestore || !selectedCommunity?.id) return null;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return query(
      collection(firestore, 'users'),
      where('communities', 'array-contains', selectedCommunity.id),
      where('joinDate', '>=', thirtyDaysAgo),
      orderBy('joinDate', 'desc'),
      limit(10)
    );
  }, [firestore, selectedCommunity?.id]);
  
  const { data: newMembers, isLoading: loadingNewMembers } = useCollection<Member>(newMembersQuery);
  
  // Get messages for this community
  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !selectedCommunity?.id) return null;
    return query(
      collection(firestore, 'messages'),
      where('communityId', '==', selectedCommunity.id),
      limit(100)
    );
  }, [firestore, selectedCommunity?.id]);
  
  const { data: messages, isLoading: loadingMessages, error: messagesError } = useCollection<Message>(messagesQuery);
  
  // Get unread messages
  const unreadMessagesQuery = useMemoFirebase(() => {
    if (!firestore || !selectedCommunity?.id || !auth.currentUser?.uid) return null;
    return query(
      collection(firestore, 'messages'),
      where('communityId', '==', selectedCommunity.id),
      where('read', '==', false),
      where('recipientId', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc'),
      limit(5)
    );
  }, [firestore, selectedCommunity?.id, auth.currentUser?.uid]);
  
  const { data: unreadMessages, isLoading: loadingUnread } = useCollection<UnreadMessage>(unreadMessagesQuery);
  
  // Calculate stats based on the loaded data
  useEffect(() => {
    if (!selectedCommunity || !members || !messages) return;
    
    try {
      // Get current date for calculations
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      
      // Calculate active members (active in last 30 days)
      const activeMembers = members.filter(member => {
        const lastActive = member.lastActive?.toDate();
        return lastActive && lastActive > thirtyDaysAgo;
      }).length;
      
      // Calculate new members this month
      const newMembersCount = members.filter(member => {
        const joinDate = member.joinDate?.toDate();
        return joinDate && joinDate > thirtyDaysAgo;
      }).length;
      
      // Calculate messages sent this month
      const messagesSentThisMonth = messages.filter(message => {
        const timestamp = message.timestamp?.toDate();
        return timestamp && timestamp > thirtyDaysAgo;
      }).length;
      
      // Calculate growth rate (compared to previous month)
      const growthRate = members.length > 0 ? Math.round((newMembersCount / members.length) * 100) : 0;
      
      // Update stats
      setStats({
        totalMembers: members.length,
        activeMembers: activeMembers,
        totalMessages: messages.length,
        unreadMessages: unreadMessages?.length || 0,
        growthRate: growthRate,
        newMembersThisMonth: newMembersCount,
        messagesSentThisMonth: messagesSentThisMonth
      });
    } catch (err) {
      console.error('Error calculating analytics stats:', err);
    }
  }, [selectedCommunity, members, messages, unreadMessages]);

  const isLoading = loadingCommunity || loadingMembers || loadingMessages || loadingUnread || loadingNewMembers;
  const errorMessage = communityError?.message || membersError?.message || messagesError?.message;

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

  if (!selectedCommunity) {
    return (
      <div className={styles.dashboardContent}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Analytics</h1>
            <p className={styles.subtitle}>
              Please select a community to view analytics
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContent}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{selectedCommunity.name} Analytics</h1>
          <p className={styles.subtitle}>
            Community performance and insights
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsSection}>
        <h2 className={styles.sectionTitle}>Overview</h2>
        <div className={styles.statsGrid}>
          <DashboardCard
            title="Total Members"
            value={stats.totalMembers}
            icon={<Users className={styles.cardIcon} />}
            trend={stats.newMembersThisMonth}
            trendLabel="this month"
          />
          <DashboardCard
            title="Active Members"
            value={stats.activeMembers}
            icon={<Activity className={styles.cardIcon} />}
            trend={Math.round((stats.activeMembers / stats.totalMembers) * 100) || 0}
            trendLabel="% active"
            trendIsPercentage
          />
          <DashboardCard
            title="Total Messages"
            value={stats.totalMessages}
            icon={<MessageSquare className={styles.cardIcon} />}
            trend={stats.messagesSentThisMonth}
            trendLabel="this month"
          />
          <DashboardCard
            title="Growth Rate"
            value={`${stats.growthRate}%`}
            icon={<TrendingUp className={styles.cardIcon} />}
            trend={stats.newMembersThisMonth}
            trendLabel="new members"
          />
        </div>
      </div>

      {/* New Members Section */}
      <div className={styles.membersSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>New Members</h2>
          <Link href={`/dashboard/members/${selectedCommunity.slug}`} className={styles.viewAllLink}>
            View All Members
          </Link>
        </div>
        
        <div className="bg-card-bg rounded-lg p-4">
          {newMembers && newMembers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {newMembers.map(member => (
                <div key={member.id} className="flex items-center p-3 bg-background rounded-md">
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                    {member.photoURL ? (
                      <img src={member.photoURL} alt={member.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span>{member.name?.charAt(0).toUpperCase() || 'U'}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-xs text-text-secondary">
                      Joined {member.joinDate?.toDate().toLocaleDateString() || 'Recently'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-text-secondary">
              <UserPlus size={48} className="mx-auto mb-4 opacity-20" />
              <p>No new members in the last 30 days</p>
            </div>
          )}
        </div>
      </div>

      {/* Unread Messages Section */}
      <div className={styles.messagesSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Unread Messages</h2>
          <Link href={`/dashboard/messages/${selectedCommunity.slug}`} className={styles.viewAllLink}>
            View All Messages
          </Link>
        </div>
        
        <div className="bg-card-bg rounded-lg p-4">
          {unreadMessages && unreadMessages.length > 0 ? (
            <div className="space-y-3">
              {unreadMessages.map(message => (
                <div key={message.id} className="p-3 bg-background rounded-md">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">{message.senderName || 'Unknown Sender'}</span>
                    <span className="text-xs text-text-secondary">
                      {message.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm">{message.content}</p>
                  <div className="flex justify-end mt-2">
                    <span className="bg-accent-pink/20 text-accent-pink text-xs px-2 py-1 rounded-full flex items-center">
                      <Bell size={12} className="mr-1" /> Unread
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-text-secondary">
              <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
              <p>No unread messages</p>
            </div>
          )}
        </div>
      </div>

      {/* Activity Calendar */}
      <div className={styles.activitySection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Monthly Activity</h2>
        </div>
        
        <div className="bg-card-bg rounded-lg p-4">
          <div className="flex items-center justify-center py-8">
            <Calendar size={48} className="text-accent-pink mr-4" />
            <div>
              <h3 className="text-xl font-medium mb-1">Activity Summary</h3>
              <p className="text-text-secondary">This month: {stats.messagesSentThisMonth} messages sent</p>
              <p className="text-text-secondary">{stats.newMembersThisMonth} new members joined</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
