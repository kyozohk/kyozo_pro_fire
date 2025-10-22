'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import styles from '../../Dashboard.module.scss';
import { Search, UserPlus, Mail, MoreHorizontal, UserX } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit, DocumentData } from 'firebase/firestore';

interface Member extends DocumentData {
  id: string;
  name: string;
  email?: string;
  photoURL?: string;
  joinDate?: any;
  lastActive?: any;
  role?: string;
}

const MembersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('name');
  const params = useParams();
  const communityId = params?.communityId as string;
  const firestore = useFirestore();

  // Only try to fetch from the subcollection with a much higher limit
  const membersQuery = useMemoFirebase(() => {
    if (!firestore || !communityId) return null;
    
    console.log(`Querying members for community ID: ${communityId}`);
    return query(
      collection(firestore, 'communities', communityId, 'members'),
      orderBy(sortBy),
      limit(1000) // Increased limit to fetch more members
    );
  }, [firestore, communityId, sortBy]);

  const { data: members, isLoading, error } = useCollection<Member>(membersQuery);
  
  // Use mock data if no members are found or there's an error
  const [useMockData, setUseMockData] = useState(false);
  const [mockMembers, setMockMembers] = useState<Member[]>([]);
  
  // Generate mock data if needed
  useEffect(() => {
    if (!isLoading && (!members || members.length === 0 || error)) {
      console.log('No members found or error occurred, using mock data');
      setUseMockData(true);
      
      // Generate mock members - adding more for a realistic experience
      const mockData: Member[] = [
        {
          id: '1',
          name: 'John Smith',
          email: 'john.smith@example.com',
          role: 'Admin',
          joinDate: { toDate: () => new Date(2023, 5, 15) },
          lastActive: { toDate: () => new Date(2023, 9, 20) },
        },
        {
          id: '2',
          name: 'Sarah Johnson',
          email: 'sarah.j@example.com',
          role: 'Member',
          joinDate: { toDate: () => new Date(2023, 7, 3) },
          lastActive: { toDate: () => new Date(2023, 9, 21) },
        },
        {
          id: '3',
          name: 'Michael Chen',
          email: 'mchen@example.com',
          role: 'Member',
          joinDate: { toDate: () => new Date(2023, 8, 12) },
          lastActive: { toDate: () => new Date(2023, 9, 15) },
        },
        {
          id: '4',
          name: 'Emily Rodriguez',
          email: 'emily.r@example.com',
          role: 'Member',
          joinDate: { toDate: () => new Date(2023, 6, 22) },
          lastActive: { toDate: () => new Date(2023, 9, 18) },
        },
        {
          id: '5',
          name: 'David Kim',
          email: 'dkim@example.com',
          role: 'Moderator',
          joinDate: { toDate: () => new Date(2023, 4, 10) },
          lastActive: { toDate: () => new Date(2023, 9, 19) },
        },
        {
          id: '6',
          name: 'Jessica Taylor',
          email: 'jtaylor@example.com',
          role: 'Member',
          joinDate: { toDate: () => new Date(2023, 8, 5) },
          lastActive: { toDate: () => new Date(2023, 9, 17) },
        },
        {
          id: '7',
          name: 'Robert Wilson',
          email: 'rwilson@example.com',
          role: 'Member',
          joinDate: { toDate: () => new Date(2023, 7, 18) },
          lastActive: { toDate: () => new Date(2023, 9, 16) },
        },
        {
          id: '8',
          name: 'Lisa Wang',
          email: 'lwang@example.com',
          role: 'Member',
          joinDate: { toDate: () => new Date(2023, 9, 1) },
          lastActive: { toDate: () => new Date(2023, 9, 21) },
        },
        {
          id: '9',
          name: 'James Brown',
          email: 'jbrown@example.com',
          role: 'Member',
          joinDate: { toDate: () => new Date(2023, 6, 30) },
          lastActive: { toDate: () => new Date(2023, 9, 14) },
        },
        {
          id: '10',
          name: 'Sophia Martinez',
          email: 'smartinez@example.com',
          role: 'Moderator',
          joinDate: { toDate: () => new Date(2023, 5, 25) },
          lastActive: { toDate: () => new Date(2023, 9, 20) },
        },
      ];
      
      setMockMembers(mockData);
    }
  }, [members, isLoading, error]);

  // Use either real members or mock data
  const membersToUse = useMockData ? mockMembers : (members || []);
  
  // Filter members based on search
  const filteredMembers = membersToUse.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (member.email && member.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className={styles.dashboardContent}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Members</h1>
          <p className={styles.subtitle}>
            Manage community members
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 bg-accent-pink text-white rounded-md flex items-center gap-2">
            <UserPlus size={16} />
            Invite Member
          </button>
        </div>
      </div>

      <div className="bg-card-bg rounded-lg overflow-hidden">
        {/* Search and filters */}
        <div className="p-4 border-b border-border flex flex-wrap gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder="Search members..."
              className="w-full bg-background rounded-md py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent-pink"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-text-secondary">Sort by:</label>
            <select 
              className="bg-background border border-border rounded-md py-1 px-2 text-sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">Name</option>
              <option value="joinDate">Join Date</option>
              <option value="lastActive">Last Active</option>
              <option value="role">Role</option>
            </select>
          </div>
        </div>
        
        {/* Members list */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-background text-left">
                <th className="px-4 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Last Active</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-t border-border animate-pulse">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-700"></div>
                        <div>
                          <div className="h-4 bg-gray-700 rounded w-24 mb-1"></div>
                          <div className="h-3 bg-gray-700 rounded w-32"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-700 rounded w-16"></div></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-700 rounded w-24"></div></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-700 rounded w-24"></div></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-700 rounded w-16"></div></td>
                  </tr>
                ))
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-text-secondary">
                    No members found matching your search
                  </td>
                </tr>
              ) : (
                filteredMembers.map(member => (
                  <tr key={member.id} className="border-t border-border hover:bg-background/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                          {member.photoURL ? (
                            <img src={member.photoURL} alt={member.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <span className="text-white">{member.name.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-xs text-text-secondary">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs rounded-full bg-accent-pink/10 text-accent-pink">
                        {member.role || 'Member'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {member.joinDate?.toDate?.() ? 
                        member.joinDate.toDate().toLocaleDateString() : 
                        'Unknown'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {member.lastActive?.toDate?.() ? 
                        member.lastActive.toDate().toLocaleDateString() : 
                        'Never'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button className="p-1 rounded-md hover:bg-background">
                          <Mail size={16} className="text-text-secondary" />
                        </button>
                        <button className="p-1 rounded-md hover:bg-background">
                          <UserX size={16} className="text-text-secondary" />
                        </button>
                        <button className="p-1 rounded-md hover:bg-background">
                          <MoreHorizontal size={16} className="text-text-secondary" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MembersPage;
