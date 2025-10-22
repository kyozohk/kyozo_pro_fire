'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import styles from '../../Dashboard.module.scss';
import { MessageSquare, Search, Send, Loader2, ServerCrash } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit, DocumentData } from 'firebase/firestore';
import Image from 'next/image';
import { format } from 'date-fns';

// --- TYPES ---
interface Community extends DocumentData {
  id: string;
  name: string;
  communityProfileImage?: string;
  logoURL?: string;
  slug?: string;
}

interface Message extends DocumentData {
  id: string;
  text: string;
  createdAt: any;
  community: string;
  sender?: string;
  messageType?: string;
  image?: {
    url: string;
    caption?: string;
  };
  readBy?: { userId: string; text: string }[];
}

interface UserProfile extends DocumentData {
  id: string;
  fullName?: string;
  phoneNumber?: string;
  role?: string;
  profileImage?: string;
  [key: string]: any;
}

interface UserWithMessages {
  userId: string;
  name: string;
  phoneNumber: string;
  role: string;
  profileImage?: string;
  messages: Message[];
  _raw: UserProfile;
}

interface InboxData {
  communityName: string;
  users: UserWithMessages[];
}

// --- HELPER FUNCTIONS & COMPONENTS ---
const formatDate = (date: any) => {
  if (!date) return '';
  if (date && (date.seconds || date._seconds)) {
    const seconds = date.seconds || date._seconds;
    return format(new Date(seconds * 1000), "HH:mm • dd/MMM/yyyy");
  }
  return format(new Date(date), "HH:mm • dd/MMM/yyyy");
};

function LoadingSpinner({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-text-secondary">
      <Loader2 className="h-12 w-12 animate-spin" />
      <p className="text-lg font-medium">{text}</p>
    </div>
  );
}

function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-destructive">
      <ServerCrash className="h-12 w-12" />
      <p className="text-lg font-medium">An Error Occurred</p>
      <p className="text-sm font-mono bg-destructive/10 p-2 rounded-md">{message}</p>
    </div>
  );
}

function MessageContent({ message }: { message: Message }) {
  return (
    <div className="space-y-2">
      {message.messageType === 'image' && message.image?.url ? (
        <div className="space-y-2">
          <Image 
            src={message.image.url} 
            alt={message.image.caption || 'Image message'} 
            width={300} 
            height={300} 
            className="rounded-md object-cover border" 
          />
          {message.image.caption && <p className="text-sm italic">{message.image.caption}</p>}
        </div>
      ) : (
        <p className="whitespace-pre-wrap">{message.text || <span className="italic">[Empty Message]</span>}</p>
      )}
    </div>
  );
}

// --- MAIN MESSAGES PAGE ---
export default function MessagesPage() {
  const firestore = useFirestore();
  const params = useParams();
  const communityId = params?.communityId as string;

  const [selectedUser, setSelectedUser] = useState<UserWithMessages | null>(null);
  const [inboxData, setInboxData] = useState<InboxData | null>(null);
  const [fullConversation, setFullConversation] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [messageText, setMessageText] = useState<string>('');

  // Query for community data
  const communityQuery = useMemoFirebase(() => {
    if (!firestore || !communityId) return null;
    return query(collection(firestore, 'communities'), where('id', '==', communityId));
  }, [firestore, communityId]);
  const { data: communityData, isLoading: loadingCommunity, error: communityError } = useCollection<Community>(communityQuery);

  // Query for messages
  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !communityId) return null;
    return query(
      collection(firestore, 'messages'),
      where('community', '==', communityId)
    );
  }, [firestore, communityId]);
  const { data: allMessages, isLoading: loadingMessages, error: messagesError } = useCollection<Message>(messagesQuery);

  // Query for sent messages (if you have a separate collection)
  const sentMessagesQuery = useMemoFirebase(() => {
    if (!firestore || !communityId) return null;
    return query(
      collection(firestore, 'sendwamessagehistories'),
      where('community', '==', communityId)
    );
  }, [firestore, communityId]);
  const { data: allSentMessages, isLoading: loadingSentMessages, error: sentMessagesError } = useCollection<Message>(sentMessagesQuery);
  
  // Query for users
  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);
  const { data: allUsers, isLoading: loadingUsers, error: usersError } = useCollection<UserProfile>(usersQuery);

  // Process data when dependencies change
  useEffect(() => {
    if (!communityId || !allMessages || !allUsers || !communityData || !allSentMessages) {
      setInboxData(null);
      setSelectedUser(null);
      setFullConversation([]);
      return;
    }

    const selectedCommunity = communityData[0];
    if (!selectedCommunity) return;

    // Combine received and sent messages for the community
    const communityMessages = allMessages || [];
    const communitySentMessages = allSentMessages || [];
    const combinedCommunityMessages = [...communityMessages, ...communitySentMessages];
    
    // Create a set of user IDs who have sent or received a message in this community
    const usersInvolved = new Set<string>();
    combinedCommunityMessages.forEach(msg => {
      if (msg.sender) usersInvolved.add(msg.sender);
      msg.readBy?.forEach(r => usersInvolved.add(r.userId));
    });
    
    const usersMap = new Map(allUsers.map(user => [user.id, user]));

    const responseUsers: UserWithMessages[] = Array.from(usersInvolved)
      .map(userId => {
        const user = usersMap.get(userId);
        if (!user) return null;

        const userMessages = combinedCommunityMessages.filter(msg => 
          msg.readBy?.some(r => r.userId === userId) || msg.sender === userId
        );

        if (userMessages.length === 0) return null;

        userMessages.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        return {
          userId: userId,
          name: user.fullName || 'Unknown User',
          phoneNumber: user.phoneNumber || user.participation?.phoneNumber || user.waNumber || user.phone || 'Unknown Phone',
          role: user.role || 'user',
          profileImage: user.profileImage,
          messages: userMessages,
          _raw: user,
        };
      })
      .filter((u): u is UserWithMessages => !!u);

    // Sort users by most recent message
    responseUsers.sort((a, b) => {
      const lastMsgTimeA = a.messages[0]?.createdAt?.seconds || 0;
      const lastMsgTimeB = b.messages[0]?.createdAt?.seconds || 0;
      return lastMsgTimeB - lastMsgTimeA;
    });
    
    setInboxData({
      communityName: selectedCommunity.name,
      users: responseUsers,
    });
    
    // Check if currently selected user still exists in the filtered list
    let currentUserStillExists = selectedUser ? responseUsers.find(u => u.userId === selectedUser.userId) : null;
    
    // If not, select the first user in the list
    if (!currentUserStillExists && responseUsers.length > 0) {
      currentUserStillExists = responseUsers[0];
    }
    
    if (currentUserStillExists) {
      setSelectedUser(currentUserStillExists);
      
      // Load the full conversation for the selected user
      const conversationMessages = combinedCommunityMessages.filter(msg => 
        (msg.readBy?.some(r => r.userId === currentUserStillExists!.userId)) || (msg.sender === currentUserStillExists!.userId)
      );
      
      // Sort messages by creation time (oldest first)
      conversationMessages.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      setFullConversation(conversationMessages);
    } else {
      setSelectedUser(null);
      setFullConversation([]);
    }
  }, [communityId, allMessages, allSentMessages, allUsers, communityData, selectedUser]);

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!inboxData?.users) return [];
    return inboxData.users.filter(user => 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phoneNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [inboxData, searchQuery]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedUser) return;
    
    // Here you would add the message to Firestore
    console.log(`Sending message to ${selectedUser.name}: ${messageText}`);
    
    // Clear input
    setMessageText('');
  };

  const isLoading = loadingCommunity || loadingMessages || loadingUsers || loadingSentMessages;
  const error = communityError || messagesError || usersError || sentMessagesError;

  return (
    <div className={styles.dashboardContent}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Messages</h1>
          <p className={styles.subtitle}>
            {inboxData ? `Community: ${inboxData.communityName}` : 'Loading community...'}
          </p>
        </div>
      </div>

      <div className="bg-card-bg rounded-lg overflow-hidden flex h-[calc(100vh-12rem)]">
        {/* Users sidebar */}
        <div className="w-1/3 border-r border-border flex flex-col">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                placeholder="Search users..."
                className="w-full bg-background rounded-md py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent-pink"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="overflow-y-auto flex-1">
            {isLoading && !inboxData ? (
              <LoadingSpinner text="Loading users..." />
            ) : error ? (
              <ErrorDisplay message={error.message} />
            ) : !inboxData || inboxData.users.length === 0 ? (
              <div className="p-4 text-center text-text-secondary mt-8">
                {isLoading ? 'Loading...' : 'No conversations in this community.'}
              </div>
            ) : (
              filteredUsers.map(user => (
                <div
                  key={user.userId}
                  className={`flex items-center p-3 cursor-pointer hover:bg-background transition-colors ${
                    selectedUser?.userId === user.userId ? 'bg-background border-l-2 border-accent-pink' : ''
                  }`}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                    {user.profileImage ? (
                      <img src={user.profileImage} alt={user.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span>{user.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.name}</p>
                    <p className="text-xs text-text-secondary truncate">{user.phoneNumber}</p>
                    {user.messages.length > 0 && (
                      <p className="text-xs text-text-secondary truncate mt-1">
                        {user.messages[0].text || '[Media Message]'}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Messages area */}
        <div className="flex-1 flex flex-col">
          {selectedUser ? (
            <>
              {/* Chat header */}
              <div className="p-4 border-b border-border flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                  {selectedUser.profileImage ? (
                    <img src={selectedUser.profileImage} alt={selectedUser.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span>{selectedUser.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <p className="font-medium">{selectedUser.name}</p>
                  <p className="text-xs text-text-secondary">{selectedUser.phoneNumber}</p>
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto">
                <div className="space-y-4 p-4">
                  {fullConversation.map(message => {
                    const isSentByUser = message.sender === selectedUser.userId;
                    
                    return (
                      <div 
                        key={message.id} 
                        className={`flex items-end gap-2 ${isSentByUser ? 'justify-start' : 'justify-end'}`}
                      >
                        {isSentByUser && (
                          <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0">
                            {selectedUser.profileImage ? (
                              <img src={selectedUser.profileImage} alt={selectedUser.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <div className="w-full h-full rounded-full flex items-center justify-center text-white text-xs">
                                {selectedUser.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="max-w-[70%]">
                          <div className={`p-3 rounded-lg ${
                            isSentByUser ? 'bg-background' : 'bg-accent-blue/20'
                          }`}>
                            <MessageContent message={message} />
                          </div>
                          <p className={`text-xs text-text-secondary mt-1 ${isSentByUser ? 'text-left' : 'text-right'}`}>
                            {formatDate(message.createdAt)}
                          </p>
                        </div>
                        {!isSentByUser && (
                          <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center text-white text-xs">
                            A
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
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
              <p>Select a user to view their conversation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
