'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  UserPlus, 
  Edit, 
  MessageSquare, 
  Globe, 
  Lock, 
  Users 
} from 'lucide-react';
import ButtonV2 from '@/components/ui/ButtonV2';
import styles from './CommunityBanner.module.scss';

interface CommunityBannerProps {
  communityId: string;
  communityName: string;
  communityDescription?: string;
  memberCount?: number;
  location?: string;
  category?: string;
  isPublic?: boolean;
  bannerURL?: string;
  logoURL?: string;
  onEditProfile?: () => void;
  onAddMembers?: () => void;
  onInvite?: () => void;
  onBroadcast?: () => void;
}

const CommunityBanner: React.FC<CommunityBannerProps> = ({
  communityId,
  communityName,
  communityDescription = '',
  memberCount = 0,
  location,
  category,
  isPublic = true,
  bannerURL,
  logoURL,
  onEditProfile,
  onAddMembers,
  onInvite,
  onBroadcast,
}) => {
  const router = useRouter();
  const defaultBannerURL = '/community-banner.png';

  return (
    <div className={styles.banner}>
      {/* Banner Image */}
      {bannerURL ? (
        <img 
          src={bannerURL} 
          alt={`${communityName} banner`}
          className={styles.bannerImage}
        />
      ) : (
        <img 
          src="/community-banner.png" 
          alt="Default community banner"
          className={styles.bannerImage}
        />
      )}
      
      <div className={styles.communityHeader}>
        <div className={styles.communityInfo}>
          {logoURL ? (
            <img 
              src={logoURL} 
              alt={`${communityName} logo`}
              className={styles.communityLogo}
            />
          ) : (
            <div className={styles.communityLogoPlaceholder}>
              {communityName.charAt(0).toUpperCase()}
            </div>
          )}
          
          <div className={styles.communityDetails}>
            <h1 className={styles.communityName}>{communityName}</h1>
            <p className={styles.communityDescription}>
              {communityDescription || 'No description provided'}
            </p>
            
            <div className={styles.communityMeta}>
              <div className={styles.privacyBadge}>
                {isPublic ? (
                  <>
                    <Globe size={16} />
                    Public Community
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    Private Community
                  </>
                )}
              </div>
              
              <div className={styles.membersBadge}>
                <Users size={16} />
                {memberCount} {memberCount === 1 ? 'member' : 'members'}
              </div>
              
              {location && (
                <div className={styles.location}>
                  📍 {location}
                </div>
              )}
              
              {category && (
                <div className={styles.category}>
                  {category}
                </div>
              )}
            </div>
            
            <div className={styles.headerActions}>
              {onEditProfile && (
                <ButtonV2 
                  variant="outline"
                  size="small"
                  onClick={onEditProfile}
                >
                  <Edit size={16} />
                  Edit Profile
                </ButtonV2>
              )}
              
              {onAddMembers && (
                <ButtonV2 
                  variant="outline"
                  size="small"
                  onClick={onAddMembers}
                >
                  <UserPlus size={16} />
                  Add Members
                </ButtonV2>
              )}
              
              {onInvite && (
                <ButtonV2 
                  variant="outline"
                  size="small"
                  onClick={onInvite}
                >
                  <UserPlus size={16} />
                  Invite
                </ButtonV2>
              )}
              
              {onBroadcast && (
                <ButtonV2 
                  variant="outline"
                  size="small"
                  onClick={onBroadcast}
                >
                  <MessageSquare size={16} />
                  Broadcast
                </ButtonV2>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityBanner;
