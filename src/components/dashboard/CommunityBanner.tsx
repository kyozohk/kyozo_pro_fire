'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { UserPlus, Edit, MessageSquare } from 'lucide-react';
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
        <Image 
          src={bannerURL} 
          alt={`${communityName} banner`}
          className={styles.bannerImage}
          fill
          priority
          sizes="100vw"
          style={{ objectFit: 'cover' }}
        />
      ) : (
        <Image 
          src={defaultBannerURL} 
          alt="Default community banner"
          className={styles.bannerImage}
          fill
          priority
          sizes="100vw"
          style={{ objectFit: 'cover' }}
        />
      )}
      
      {/* Gradient Overlay */}
      <div className={styles.bannerOverlay}></div>
      
      {/* Content Container */}
      <div className={styles.contentContainer}>
        {/* Top Section: Community Name and Description */}
        <div className={styles.topSection}>
          <h1 className={styles.communityName}>{communityName}</h1>
          <p className={styles.communityDescription}>
            {communityDescription || 'No description provided'}
          </p>
        </div>
        
        {/* Middle Section: Badges */}
        <div className={styles.badgesSection}>
          {/* Privacy Badge */}
          <div className={styles.badge}>
            {isPublic ? '🌐 Public Community' : '🔒 Private Community'}
          </div>
          
          {/* Members Badge */}
          <div className={styles.badge}>
            👥 {memberCount} members
          </div>
          
          {/* Location Badge (if provided) */}
          {location && (
            <div className={styles.badge}>
              📍 {location}
            </div>
          )}
          
          {/* Category Badge (if provided) */}
          {category && (
            <div className={styles.categoryBadge}>
              {category}
            </div>
          )}
        </div>
        
        {/* Bottom Section: Community Logo and Action Buttons */}
        <div className={styles.bottomSection}>
          {/* Community Logo */}
          <div className={styles.logoContainer}>
            {logoURL ? (
              <Image 
                src={logoURL} 
                alt={`${communityName} logo`}
                width={80}
                height={80}
                className={styles.communityLogo}
              />
            ) : (
              <div className={styles.communityLogoPlaceholder}>
                {communityName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            {onEditProfile && (
              <button 
                onClick={onEditProfile}
                className={styles.actionButton}
              >
                <Edit size={16} />
                <span>Edit Profile</span>
              </button>
            )}
            
            {onAddMembers && (
              <button 
                onClick={onAddMembers}
                className={styles.actionButton}
              >
                <UserPlus size={16} />
                <span>Add Members</span>
              </button>
            )}
            
            {onInvite && (
              <button 
                onClick={onInvite}
                className={styles.actionButton}
              >
                <UserPlus size={16} />
                <span>Invite</span>
              </button>
            )}
            
            {onBroadcast && (
              <button 
                onClick={onBroadcast}
                className={styles.actionButton}
              >
                <MessageSquare size={16} />
                <span>Broadcast</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityBanner;
