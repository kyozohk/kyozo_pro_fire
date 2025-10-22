'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useParams } from 'next/navigation';
import styles from '../Dashboard.module.scss';
import { MessageSquare, Search, Send } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit, DocumentData } from 'firebase/firestore';

interface Member extends DocumentData {
  id: string;
  name: string;
  email?: string;
  photoURL?: string;
  lastActive?: Date;
  role?: string;
}

interface Message extends DocumentData {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  timestamp: Date;
  read: boolean;
}

const MessagesPage: React.FC = () => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [messageText, setMessageText] = useState<string>('');
  const params = useParams();
  const pathname = usePathname();
  const firestore = useFirestore();
  const communitySlug = params?.slug as string;

  // Query for members
  const membersQuery = useMemoFirebase(() => {
    if (!firestore || !communitySlug) return null;
    return query(
      collection(firestore, 'users'),
      where('communities', 'array-contains', communitySlug),
      limit(20)
    );
  }, [firestore, communitySlug]);

  const { data: members, isLoading: membersLoading } = useCollection<Member>(membersQuery);

  // Select first member by default
  useEffect(() => {
    if (members?.length && !selectedMemberId) {
      setSelectedMemberId(members[0].id);
    }
  }, [members, selectedMemberId]);

  // Filter members based on search
  const filteredMembers = members?.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Messages component that only reloads when selectedMemberId changes
  const Messages = React.memo(({ memberId }: { memberId: string }) => {
    const firestore = useFirestore();
    
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
    
    const { data: messages, isLoading: messagesLoading } = useCollection<Message>(messagesQuery);
    
    if (messagesLoading) {
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
    
    if (!messages?.length) {
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
        {messages.map(message => (
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
              {message.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
