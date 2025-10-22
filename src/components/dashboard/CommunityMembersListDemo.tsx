'use client';

import React, { useState } from 'react';
import CommunityMembersList, { Member } from './CommunityMembersList';

const CommunityMembersListDemo: React.FC = () => {
  // Sample members data with admin roles
  const [members] = useState<Member[]>([
    {
      id: '1',
      fullName: 'Ben Zen',
      email: 'ben@example.com',
      phoneNumber: '+1 6468092088',
      role: 'member',
      status: 'active'
    },
    {
      id: '2',
      fullName: 'Cath O\'Leary',
      email: 'cath@example.com',
      phoneNumber: '+63 9356523830',
      role: 'member',
      status: 'active'
    },
    {
      id: '3',
      fullName: 'Willer Pool',
      email: 'willer@example.com',
      phoneNumber: '+852 5180 5868',
      role: 'member',
      status: 'active'
    },
    {
      id: '4',
      fullName: 'Ashok Jaiswal',
      email: 'ashok@example.com',
      phoneNumber: '+852 60434478',
      role: 'admin',
      status: 'active'
    },
    {
      id: '5',
      fullName: 'Sarah Johnson',
      email: 'sarah@example.com',
      phoneNumber: '+1 2345678901',
      role: 'admin',
      status: 'active'
    },
    {
      id: '6',
      fullName: 'Michael Chen',
      email: 'michael@example.com',
      phoneNumber: '+65 98765432',
      role: 'moderator',
      status: 'active'
    }
  ]);

  const handleEdit = (member: Member) => {
    console.log('Edit member:', member);
  };

  const handleMessage = (member: Member) => {
    console.log('Message member:', member);
  };

  const handleCall = (member: Member) => {
    console.log('Call member:', member);
  };

  const handleEmail = (member: Member) => {
    console.log('Email member:', member);
  };

  const handleDelete = (member: Member) => {
    console.log('Delete member:', member);
  };

  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ marginBottom: '2rem', color: 'white' }}>Community Members</h1>
      
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
        <button 
          onClick={() => setViewMode('list')}
          style={{ 
            padding: '0.5rem 1rem', 
            background: viewMode === 'list' ? 'rgba(139, 92, 246, 0.8)' : 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '0.5rem',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          List View
        </button>
        <button 
          onClick={() => setViewMode('card')}
          style={{ 
            padding: '0.5rem 1rem', 
            background: viewMode === 'card' ? 'rgba(139, 92, 246, 0.8)' : 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '0.5rem',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          Card View
        </button>
      </div>
      
      <CommunityMembersList
        members={members}
        defaultViewMode={viewMode}
        onEdit={handleEdit}
        onMessage={handleMessage}
        onCall={handleCall}
        onEmail={handleEmail}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default CommunityMembersListDemo;
