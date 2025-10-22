'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Users, 
  Building2, 
  MessageSquare, 
  Settings, 
  Menu, 
  X,
  LayoutGrid,
  ChevronDown
} from 'lucide-react';
import { CommunitySelectEx, Loading } from '@/components/dashboard';
import styles from './layout.module.scss';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>('');
  const pathname = usePathname();

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

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: <Home size={20} /> },
    { href: '/dashboard/communities', label: 'Communities', icon: <Building2 size={20} /> },
    { href: '/dashboard/messages', label: 'Messages', icon: <MessageSquare size={20} /> },
    { href: '/dashboard/members', label: 'Members', icon: <Users size={20} /> },
    { href: '/dashboard/settings', label: 'Settings', icon: <Settings size={20} /> },
    { href: '/dashboard/examples', label: 'Examples', icon: <LayoutGrid size={20} /> },
    { href: '/dashboard/suspense-example', label: 'Suspense Demo', icon: <LayoutGrid size={20} /> },
    { href: '/dashboard/enhanced-select-example', label: 'Enhanced Select', icon: <LayoutGrid size={20} /> },
  ];

  return (
    <div className={styles.dashboardLayout}>
      <aside className={`${styles.sidebar} ${isMobileMenuOpen ? styles.open : ''}`}>
        <div className={styles.logoContainer}>          
          <div className={styles.communitySelector}>
            <CommunitySelectEx
              value={selectedCommunityId}
              onChange={setSelectedCommunityId}
              placeholder="Select a community"
              className={styles.communityDropdown}
            />
          </div>
        </div>
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${pathname === item.href ? styles.active : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
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
