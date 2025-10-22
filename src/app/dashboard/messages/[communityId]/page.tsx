'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import styles from '../../Dashboard.module.scss';
import { MessageSquare, Search, Send } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit, DocumentData } from 'firebase/firestore';

interface Member extends DocumentData {
  id: string;
  name: string;
  email?: string;
  photoURL?: string;
  lastActive?: any; // Using 'any' to handle Firestore Timestamp or mock data
  role?: string;
}

interface Message extends DocumentData {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  timestamp: any; // Using 'any' to handle Firestore Timestamp
  read: boolean;
}

const MessagesPage: React.FC = () => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [messageText, setMessageText] = useState<string>('');
  const params = useParams();
  const communityId = params?.communityId as string;
  const firestore = useFirestore();

  // Only try to fetch from the subcollection
  const membersQuery = useMemoFirebase(() => {
    if (!firestore || !communityId) return null;
    
    console.log(`Messages page: Querying members for community ID: ${communityId}`);
    return query(
      collection(firestore, 'communities', communityId, 'members'),
      limit(20)
    );
  }, [firestore, communityId]);

  const { data: members, isLoading: membersLoading, error: membersError } = useCollection<Member>(membersQuery);
  
  // Use mock data if no members are found or there's an error
  const [useMockData, setUseMockData] = useState(false);
  const [mockMembers, setMockMembers] = useState<Member[]>([]);
  
  // Generate mock data if needed
  useEffect(() => {
    if (!membersLoading && (!members || members.length === 0 || membersError)) {
      console.log('Messages page: No members found or error occurred, using mock data');
      setUseMockData(true);
      
      // Generate mock members - adding more for a realistic experience
      const mockData: Member[] = [
        {
          id: '1',
          name: 'John Smith',
          email: 'john.smith@example.com',
          photoURL: 'https://randomuser.me/api/portraits/men/32.jpg',
          lastActive: { toDate: () => new Date(2023, 9, 20) },
          role: 'Admin'
        },
        {
          id: '2',
          name: 'Sarah Johnson',
          email: 'sarah.j@example.com',
          photoURL: 'https://randomuser.me/api/portraits/women/44.jpg',
          lastActive: { toDate: () => new Date(2023, 9, 21) },
          role: 'Member'
        },
        {
          id: '3',
          name: 'Michael Chen',
          email: 'mchen@example.com',
          photoURL: 'https://randomuser.me/api/portraits/men/22.jpg',
          lastActive: { toDate: () => new Date(2023, 9, 15) },
          role: 'Member'
        },
        {
          id: '4',
          name: 'Emily Rodriguez',
          email: 'emily.r@example.com',
          photoURL: 'https://randomuser.me/api/portraits/women/67.jpg',
          lastActive: { toDate: () => new Date(2023, 9, 18) },
          role: 'Member'
        },
        {
          id: '5',
          name: 'David Kim',
          email: 'dkim@example.com',
          photoURL: 'https://randomuser.me/api/portraits/men/45.jpg',
          lastActive: { toDate: () => new Date(2023, 9, 19) },
          role: 'Moderator'
        },
        {
          id: '6',
          name: 'Jessica Taylor',
          email: 'jtaylor@example.com',
          photoURL: 'https://randomuser.me/api/portraits/women/33.jpg',
          lastActive: { toDate: () => new Date(2023, 9, 17) },
          role: 'Member'
        },
        {
          id: '7',
          name: 'Robert Wilson',
          email: 'rwilson@example.com',
          photoURL: 'https://randomuser.me/api/portraits/men/52.jpg',
          lastActive: { toDate: () => new Date(2023, 9, 16) },
          role: 'Member'
        },
      ];
      
      setMockMembers(mockData);
    }
  }, [members, membersLoading, membersError]);

  // Use either real members or mock data
  const membersToUse = useMockData ? mockMembers : (members || []);
  
  // Select first member by default
  useEffect(() => {
    if (membersToUse.length && !selectedMemberId) {
      setSelectedMemberId(membersToUse[0].id);
    }
  }, [membersToUse, selectedMemberId]);

  // Filter members based on search
  const filteredMembers = membersToUse.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Messages component that only reloads when selectedMemberId changes
  const Messages = React.memo(({ memberId }: { memberId: string }) => {
    const firestore = useFirestore();
    const [useMockMessages, setUseMockMessages] = useState(false);
    const [mockMessages, setMockMessages] = useState<Message[]>([]);
    
    // Query for messages with selected member
    const messagesQuery = useMemoFirebase(() => {
      if (!firestore || !memberId) return null;
      return query(
        collection(firestore, 'messages'),
        where('participants', 'array-contains', memberId),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
    }, [firestore, memberId]);
    
    const { data: messages, isLoading: messagesLoading, error: messagesError } = useCollection<Message>(messagesQuery);
    
    // Generate mock messages if needed
    useEffect(() => {
      if (!messagesLoading && (!messages || messages.length === 0 || messagesError)) {
        console.log('No messages found or error occurred, using mock data');
        setUseMockMessages(true);
        
        // Generate mock messages
        const mockData: Message[] = [
          {
            id: '1',
            content: 'Hello! How are you doing today?',
            senderId: 'currentUser',
            receiverId: memberId,
            timestamp: { toDate: () => new Date(2023, 9, 21, 10, 30) },
            read: true
          },
          {
            id: '2',
            content: 'I\'m doing well, thanks for asking! How about you?',
            senderId: memberId,
            receiverId: 'currentUser',
            timestamp: { toDate: () => new Date(2023, 9, 21, 10, 32) },
            read: true
          },
          {
            id: '3',
            content: 'Great! I wanted to discuss the upcoming project deadline.',
            senderId: 'currentUser',
            receiverId: memberId,
            timestamp: { toDate: () => new Date(2023, 9, 21, 10, 35) },
            read: true
          },
        ];
        
        setMockMessages(mockData);
      }
    }, [messages, messagesLoading, messagesError, memberId]);
    
    // Use either real messages or mock data
    const messagesToUse = useMockMessages ? mockMessages : (messages || []);
    
    if (messagesLoading && !useMockMessages) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-700 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    if (!messagesToUse.length) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-text-secondary">
          <MessageSquare size={48} className="opacity-20 mb-4" />
          <p>No messages yet</p>
          <p className="text-sm">Start a conversation!</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4 p-4">
        {messagesToUse.map(message => (
          <div 
            key={message.id} 
            className={`p-3 rounded-lg max-w-[80%] ${
              message.senderId === 'currentUser' 
                ? 'bg-accent-blue/20 ml-auto' 
                : 'bg-card-bg mr-auto'
            }`}
          >
            <p>{message.content}</p>
            <p className="text-xs text-text-secondary mt-1">
              {message.timestamp?.toDate?.() ? 
                message.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
                'Unknown time'}
            </p>
          </div>
        ))}
      </div>
    );
  });
  
  Messages.displayName = 'Messages';

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedMemberId) return;
    
    // Here you would add the message to Firestore
    console.log(`Sending message to ${selectedMemberId}: ${messageText}`);
    
    // Clear input
    setMessageText('');
  };

  return (
    <div className={styles.dashboardContent}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Messages</h1>
          <p className={styles.subtitle}>
            Chat with community members
          </p>
        </div>
      </div>

      <div className="bg-card-bg rounded-lg overflow-hidden flex h-[calc(100vh-12rem)]">
        {/* Members sidebar */}
        <div className="w-1/3 border-r border-border flex flex-col">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                placeholder="Search members..."
                className="w-full bg-background rounded-md py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent-pink"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="overflow-y-auto flex-1">
            {membersLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-gray-700"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              filteredMembers.map(member => (
                <div
                  key={member.id}
                  className={`flex items-center p-3 cursor-pointer hover:bg-background transition-colors ${
                    selectedMemberId === member.id ? 'bg-background border-l-2 border-accent-pink' : ''
                  }`}
                  onClick={() => setSelectedMemberId(member.id)}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                    {member.photoURL ? (
                      <img src={member.photoURL} alt={member.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span>{member.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-xs text-text-secondary">{member.role || 'Member'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Messages area */}
        <div className="flex-1 flex flex-col">
          {selectedMemberId ? (
            <>
              {/* Chat header */}
              <div className="p-4 border-b border-border flex items-center">
                {members?.find(m => m.id === selectedMemberId)?.name || 'Loading...'}
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto flex flex-col-reverse">
                <Messages memberId={selectedMemberId} />
              </div>
              
              {/* Message input */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-border flex items-center">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 bg-background rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-accent-pink"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                />
                <button
                  type="submit"
                  className="ml-2 p-2 bg-accent-pink rounded-md text-white hover:bg-accent-pink/90 transition-colors"
                  disabled={!messageText.trim()}
                >
                  <Send size={18} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-text-secondary">
              <MessageSquare size={48} className="opacity-20 mb-4" />
              <p>Select a member to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
