'use client';

import React, { useState } from 'react';
import { EnhancedSelect, SelectOption } from '@/components/ui';
import styles from '../Dashboard.module.scss';
import { Building2, User, Brush, Code, Briefcase, Gamepad2 } from 'lucide-react';

const mockCommunities: SelectOption[] = [
  { value: 'after-dark', label: 'After Dark @ The Aubrey', icon: <Building2 size={18} /> },
  { value: 'aya-studios', label: 'Aya Studios', icon: <Brush size={18} /> },
  { value: 'curated-connection', label: 'Curated ConNEXTion', icon: <User size={18} /> },
  { value: 'dev-community', label: 'DEV Community', icon: <Code size={18} /> },
  { value: 'demo-community', label: 'Demo Community', icon: <Briefcase size={18} /> },
  { value: 'digital-art-fair', label: 'Digital Art Fair', icon: <Brush size={18} /> },
  { value: 'gaming-guild', label: 'Gaming Guild', icon: <Gamepad2 size={18} /> },
  { value: 'tech-innovators', label: 'Tech Innovators', icon: <Code size={18} /> },
  { value: 'creative-minds', label: 'Creative Minds', icon: <Brush size={18} /> },
  { value: 'business-network', label: 'Business Network', icon: <Briefcase size={18} /> },
  { value: 'startup-hub', label: 'Startup Hub', icon: <Building2 size={18} /> },
  { value: 'design-collective', label: 'Design Collective', icon: <Brush size={18} /> },
  { value: 'code-crafters', label: 'Code Crafters', icon: <Code size={18} /> },
  { value: 'digital-nomads', label: 'Digital Nomads', icon: <User size={18} /> },
  { value: 'product-managers', label: 'Product Managers', icon: <Briefcase size={18} /> },
  { value: 'ux-designers', label: 'UX Designers', icon: <Brush size={18} /> },
  { value: 'data-scientists', label: 'Data Scientists', icon: <Code size={18} /> },
  { value: 'content-creators', label: 'Content Creators', icon: <User size={18} /> },
  { value: 'marketing-pros', label: 'Marketing Pros', icon: <Briefcase size={18} /> },
  { value: 'ai-enthusiasts', label: 'AI Enthusiasts', icon: <Code size={18} /> },
];

const EnhancedSelectExamplePage: React.FC = () => {
  const [selectedCommunity, setSelectedCommunity] = useState<string>('');
  const [selectedCommunityWithImage, setSelectedCommunityWithImage] = useState<string>('');

  // Create options with images
  const communitiesWithImages = mockCommunities.map(community => ({
    ...community,
    image: `/community-icons/${community.value}.png`, // This is just for example, use actual image paths
  }));

  return (
    <div className={styles.dashboardContent}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Enhanced Select Component</h1>
          <p className={styles.subtitle}>
            A custom select component for large lists with search functionality
          </p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className={styles.sectionTitle}>Basic Usage with Icons</h2>
        <p className="mb-4 text-text-secondary">
          Select component with icons and search functionality
        </p>
        
        <div className="max-w-md">
          <EnhancedSelect
            options={mockCommunities}
            value={selectedCommunity}
            onChange={setSelectedCommunity}
            placeholder="Select a community"
          />
          
          {selectedCommunity && (
            <div className="mt-4 p-4 bg-card-bg rounded-lg">
              <p>Selected: {mockCommunities.find(c => c.value === selectedCommunity)?.label}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mb-8">
        <h2 className={styles.sectionTitle}>With Profile Images</h2>
        <p className="mb-4 text-text-secondary">
          Select component with profile images and search functionality
        </p>
        
        <div className="max-w-md">
          <EnhancedSelect
            options={communitiesWithImages}
            value={selectedCommunityWithImage}
            onChange={setSelectedCommunityWithImage}
            placeholder="Select a community"
          />
          
          {selectedCommunityWithImage && (
            <div className="mt-4 p-4 bg-card-bg rounded-lg">
              <p>Selected: {communitiesWithImages.find(c => c.value === selectedCommunityWithImage)?.label}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedSelectExamplePage;
