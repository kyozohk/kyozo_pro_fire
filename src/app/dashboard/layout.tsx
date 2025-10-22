'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, 
  Users, 
  MessageSquare, 
  CreditCard, 
  Menu, 
  X,
  LayoutGrid
} from 'lucide-react';
import { CommunitySelectEx, Loading } from '@/components/dashboard';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, DocumentData } from 'firebase/firestore';
import styles from './layout.module.scss';

interface Community extends DocumentData {
  id: string;
  name: string;
  slug: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>('');
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const firestore = useFirestore();

  // Close mobile menu when path changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        isMobileMenuOpen && 
        !target.closest(`.${styles.sidebar}`) && 
        !target.closest(`.${styles.mobileMenuButton}`)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  // Query for communities - make sure this is defined before handleCommunityChange
  const communitiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'communities'), where('name', '!=', ''));
  }, [firestore]);
  
  const { data: communities, isLoading } = useCollection<Community>(communitiesQuery);
  
  // Extract community ID directly from URL if present
  const communityIdFromUrl = React.useMemo(() => {
    const segments = pathname.split('/');
    
    // Check if there's a segment after /dashboard/ that could be a community ID
    if (segments.length > 2 && segments[2] !== '') {
      // If it's a direct child of /dashboard/
      if (!['messages', 'members', 'subscription', 'suspense-example'].includes(segments[2])) {
        return segments[2]; // This is likely a community ID
      }
      // If it's under a section like /dashboard/messages/{communityId}
      else if (segments.length > 3 && segments[3] !== '') {
        return segments[3]; // This is likely a community ID under a section
      }
    }
    return null;
  }, [pathname]);

  // Set selected community from URL parameter as highest priority
  useEffect(() => {
    if (communityIdFromUrl && communities?.length) {
      // Only update if it's different to avoid loops
      if (communityIdFromUrl !== selectedCommunityId) {
        console.log('Setting community from URL:', communityIdFromUrl);
        setSelectedCommunityId(communityIdFromUrl);
        
        // Also find and set the community object
        const community = communities.find(c => c.id === communityIdFromUrl);
        if (community) {
          setSelectedCommunity(community);
        }
      }
    }
    // Only select first community if no community ID in URL and none selected yet
    else if (communities?.length && !selectedCommunityId && !communityIdFromUrl) {
      console.log('Auto-selecting first community as fallback');
      setSelectedCommunityId(communities[0].id);
      setSelectedCommunity(communities[0]);
    }
  }, [communities, selectedCommunityId, communityIdFromUrl]);
  
  // Update selected community when ID changes
  useEffect(() => {
    if (selectedCommunityId && communities?.length) {
      const community = communities.find(c => c.id === selectedCommunityId);
      if (community) {
        setSelectedCommunity(community);
      }
    }
  }, [selectedCommunityId, communities]);
  
  // We've replaced this with the more comprehensive communityIdFromUrl logic above
  
  // Handle community selection change
  const handleCommunityChange = (communityId: string) => {
    console.log('Layout handleCommunityChange called with:', communityId);
    setSelectedCommunityId(communityId);
    
    // Extract the current section from the path (e.g., messages, members, etc.)
    const basePath = '/dashboard';
    const currentPath = pathname.replace(basePath, '');
    const segments = currentPath.split('/').filter(Boolean);
    const firstSegment = segments[0] || ''; // Get the first segment (section)
    
    // Navigate to the section with the community ID directly
    const newPath = firstSegment 
      ? `/dashboard/${firstSegment}/${communityId}` 
      : `/dashboard/${communityId}`;
    
    console.log('Navigating to:', newPath);
    
    // Use window.location for a hard navigation to ensure it works
    window.location.href = newPath;
  };

  // Dynamic navigation based on selected community
  const navItems = [
    { href: '/dashboard', label: 'Analytics', icon: <LayoutGrid size={20} /> },
    { href: '/dashboard/messages', label: 'Messages', icon: <MessageSquare size={20} /> },
    { href: '/dashboard/members', label: 'Members', icon: <Users size={20} /> },
    { href: '/dashboard/subscription', label: 'Subscription', icon: <CreditCard size={20} /> },
    { href: '/dashboard/suspense-example', label: 'Suspense Demo', icon: <LayoutGrid size={20} /> },
    { href: '/landing', label: 'Community Inbox', icon: <MessageSquare size={20} /> },
  ];

  return (
    <div className={styles.dashboardLayout}>
      {/* SVG gradient definition for sidebar icons */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="sidebar-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--accent-pink)" />
            <stop offset="100%" stopColor="var(--accent-purple)" />
          </linearGradient>
        </defs>
      </svg>
      <aside className={`${styles.sidebar} ${isMobileMenuOpen ? styles.open : ''}`}>
        <div className={styles.logoContainer}>          
          <div className={styles.communitySelector}>
            <CommunitySelectEx
              value={selectedCommunityId}
              onChange={handleCommunityChange}
              placeholder="Select a community"
              className={styles.communityDropdown}
            />
          </div>
        </div>
        <nav className={styles.nav}>
          {navItems.map((item) => {
            // Create dynamic href with community ID if available
            const href = selectedCommunityId 
              ? `${item.href}/${selectedCommunityId}` 
              : item.href;
              
            // Check if this route is active - more precise matching to ensure only one item is active
            const isActive = (() => {
              // Exact match for dashboard root
              if (item.href === '/dashboard' && pathname === '/dashboard') {
                return true;
              }
              
              // For specific sections, check if the pathname starts with the route path
              // but not if it's just a substring of another route
              if (item.href !== '/dashboard') {
                const routePath = item.href.endsWith('/') ? item.href : `${item.href}/`;
                const pathnameToCheck = pathname.endsWith('/') ? pathname : `${pathname}/`;
                
                // Check if pathname starts with the route path (e.g., /dashboard/messages/)
                return pathnameToCheck.startsWith(routePath);
              }
              
              return false;
            })();
            
            return (
              <Link
                key={item.href}
                href={href}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className={styles.content}>
        {children}
      </main>
      <button
        className={styles.mobileMenuButton}
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
    </div>
  );
}
