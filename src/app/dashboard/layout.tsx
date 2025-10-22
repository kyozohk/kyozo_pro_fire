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

  // Query for communities
  const communitiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'communities'), where('name', '!=', ''), limit(20));
  }, [firestore]);
  
  const { data: communities, isLoading } = useCollection<Community>(communitiesQuery);
  
  // Select first community by default
  useEffect(() => {
    if (communities?.length && !selectedCommunityId) {
      setSelectedCommunityId(communities[0].id);
      setSelectedCommunity(communities[0]);
    }
  }, [communities, selectedCommunityId]);
  
  // Update selected community when ID changes
  useEffect(() => {
    if (selectedCommunityId && communities?.length) {
      const community = communities.find(c => c.id === selectedCommunityId);
      if (community) {
        setSelectedCommunity(community);
      }
    }
  }, [selectedCommunityId, communities]);
  
  // Listen for community selection from URL
  useEffect(() => {
    const handleCommunitySelectedEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.id) {
        setSelectedCommunityId(customEvent.detail.id);
      }
    };
    
    document.addEventListener('communitySelected', handleCommunitySelectedEvent);
    
    return () => {
      document.removeEventListener('communitySelected', handleCommunitySelectedEvent);
    };
  }, []);
  
  // Handle community selection change
  const handleCommunityChange = (communityId: string) => {
    setSelectedCommunityId(communityId);
    
    // Find the selected community to get its slug
    if (communities?.length) {
      const selectedCommunity = communities.find(community => community.id === communityId);
      if (selectedCommunity?.slug) {
        // Extract the current section from the path (e.g., messages, members, etc.)
        const basePath = '/dashboard';
        const currentPath = pathname.replace(basePath, '');
        const segments = currentPath.split('/').filter(Boolean);
        const firstSegment = segments[0] || ''; // Get the first segment (section)
        
        // Navigate to the section with the community slug
        const newPath = firstSegment 
          ? `/dashboard/${firstSegment}/${selectedCommunity.slug}` 
          : `/dashboard/${selectedCommunity.slug}`;
        
        router.push(newPath);
      }
    }
  };

  // Dynamic navigation based on selected community
  const navItems = [
    { href: '/dashboard', label: 'Analytics', icon: <LayoutGrid size={20} /> },
    { href: '/dashboard/messages', label: 'Messages', icon: <MessageSquare size={20} /> },
    { href: '/dashboard/members', label: 'Members', icon: <Users size={20} /> },
    { href: '/dashboard/subscription', label: 'Subscription', icon: <CreditCard size={20} /> },
    { href: '/dashboard/suspense-example', label: 'Suspense Demo', icon: <LayoutGrid size={20} /> },
  ];

  return (
    <div className={styles.dashboardLayout}>
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
            // Create dynamic href with community slug if available
            const href = selectedCommunity?.slug 
              ? `${item.href}/${selectedCommunity.slug}` 
              : item.href;
              
            // Check if this route is active - either exact match or includes both the route and slug
            const isActive = pathname === item.href || 
              (pathname.includes(item.href) && 
               (selectedCommunity?.slug ? pathname.includes(selectedCommunity.slug) : true));
            
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
