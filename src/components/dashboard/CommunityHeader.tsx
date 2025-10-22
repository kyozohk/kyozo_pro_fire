'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ChevronRight, 
  Plus, 
  Users, 
  Settings, 
  Megaphone, // Using Megaphone instead of HiSpeakerphone
  MessageSquare
} from 'lucide-react';
import styles from './CommunityHeader.module.scss';

interface CommunityHeaderProps {
  communityName: string;
  communityId: string;
  description?: string;
  showBreadcrumbs?: boolean;
  showActions?: boolean;
  onBroadcast?: () => void;
  onInvite?: () => void;
  onSettings?: () => void;
}

const CommunityHeader: React.FC<CommunityHeaderProps> = ({
  communityName,
  communityId,
  description,
  showBreadcrumbs = true,
  showActions = true,
  onBroadcast,
  onInvite,
  onSettings
}) => {
  const router = useRouter();

  const handleBroadcast = () => {
    if (onBroadcast) {
      onBroadcast();
    } else {
      router.push(`/dashboard/communities/${communityId}/broadcast`);
    }
  };

  const handleInvite = () => {
    if (onInvite) {
      onInvite();
    } else {
      router.push(`/dashboard/communities/${communityId}/invite`);
    }
  };

  const handleSettings = () => {
    if (onSettings) {
      onSettings();
    } else {
      router.push(`/dashboard/communities/${communityId}/settings`);
    }
  };

  const handleMessages = () => {
    router.push(`/dashboard/communities/${communityId}/messages`);
  };

  return (
    <div>
      {showBreadcrumbs && (
        <div className={styles.breadcrumbs}>
          <Link href="/dashboard" className={styles.breadcrumbLink}>
            Dashboard
          </Link>
          <ChevronRight size={14} className={styles.breadcrumbSeparator} />
          <Link href="/dashboard/communities" className={styles.breadcrumbLink}>
            Communities
          </Link>
          <ChevronRight size={14} className={styles.breadcrumbSeparator} />
          <span>{communityName}</span>
        </div>
      )}

      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>{communityName}</h1>
          {description && <p className={styles.subtitle}>{description}</p>}
        </div>

        {showActions && (
          <div className={styles.actions}>
            <button
              onClick={handleBroadcast}
              className={`${styles.actionButton} ${styles.secondary}`}
            >
              <Megaphone className={styles.actionIcon} />
              Broadcast
            </button>
            <button
              onClick={handleInvite}
              className={`${styles.actionButton} ${styles.secondary}`}
            >
              <Plus className={styles.actionIcon} />
              Invite
            </button>
            <button
              onClick={handleMessages}
              className={`${styles.actionButton} ${styles.secondary}`}
            >
              <MessageSquare className={styles.actionIcon} />
              Messages
            </button>
            <button
              onClick={handleSettings}
              className={`${styles.actionButton} ${styles.secondary}`}
            >
              <Settings className={styles.actionIcon} />
              Settings
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityHeader;
