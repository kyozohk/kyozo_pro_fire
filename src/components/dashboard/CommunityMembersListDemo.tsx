'use client';

import React, { useState } from 'react';
import CommunityMembersList, { Member } from './CommunityMembersList';

const CommunityMembersListDemo: React.FC = () => {
  // Sample members data
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

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ marginBottom: '2rem', color: 'white' }}>Community Members</h1>
      
      <CommunityMembersList
        members={members}
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
