'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, DocumentData } from 'firebase/firestore';
import { Loader2, MessageSquare, ServerCrash } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import styles from './landing.module.scss';

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
    return formatDistanceToNow(new Date(seconds * 1000), { addSuffix: true });
  }
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

function LoadingSpinner({ text }: { text: string }) {
  return (
    <div className={styles.loadingContainer}>
      <Loader2 className={styles.loadingSpinner} />
      <p>{text}</p>
    </div>
  );
}

function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className={styles.errorContainer}>
      <ServerCrash className={styles.errorIcon} />
      <p>An Error Occurred</p>
      <p className={styles.errorMessage}>{message}</p>
    </div>
  );
}

function MessageContent({ message }: { message: Message }) {
  return (
    <div className={styles.messageContent}>
      {message.messageType === 'image' && message.image?.url ? (
        <div className={styles.imageMessage}>
          <Image 
            src={message.image.url} 
            alt={message.image.caption || 'Image message'} 
            width={300} 
            height={300} 
            className={styles.messageImage} 
          />
          {message.image.caption && <p className={styles.imageCaption}>{message.image.caption}</p>}
        </div>
      ) : (
        <p className={styles.messageText}>{message.text || <span className={styles.emptyMessage}>[Empty Message]</span>}</p>
      )}
    </div>
  );
}

// --- MAIN LANDING PAGE ---
export default function LandingPage() {
  const firestore = useFirestore();

  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserWithMessages | null>(null);
  const [inboxData, setInboxData] = useState<InboxData | null>(null);
  const [fullConversation, setFullConversation] = useState<Message[]>([]);

  // Query for communities
  const communitiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'communities'), where('name', '!=', ''));
  }, [firestore]);
  const { data: communities, isLoading: loadingCommunities, error: communitiesError } = useCollection<Community>(communitiesQuery);

  // Query for messages
  const messagesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'messages');
  }, [firestore]);
  const { data: allMessages, isLoading: loadingMessages, error: messagesError } = useCollection<Message>(messagesQuery);

  // Query for sent messages (if you have a separate collection)
  const sentMessagesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'sendwamessagehistories');
  }, [firestore]);
  const { data: allSentMessages, isLoading: loadingSentMessages, error: sentMessagesError } = useCollection<Message>(sentMessagesQuery);
  
  // Query for users
  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);
  const { data: allUsers, isLoading: loadingUsers, error: usersError } = useCollection<UserProfile>(usersQuery);

  // Process data when dependencies change
  useEffect(() => {
    if (!selectedCommunityId || !allMessages || !allUsers || !communities || !allSentMessages) {
      setInboxData(null);
      setSelectedUser(null);
      setFullConversation([]);
      return;
    }

    const selectedCommunity = communities.find(c => c.id === selectedCommunityId);
    if (!selectedCommunity) return;

    // Combine received and sent messages for the community
    const communityMessages = allMessages.filter(msg => msg.community === selectedCommunityId);
    const communitySentMessages = allSentMessages.filter(msg => msg.community === selectedCommunityId);
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
          phoneNumber: user.phoneNumber || 'Unknown Phone',
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
  }, [selectedCommunityId, allMessages, allSentMessages, allUsers, communities, selectedUser]);

  // Sort communities by name
  const sortedCommunities = useMemo(() => {
    if (!communities) return [];
    return [...communities].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [communities]);

  // Auto-select first community if none selected
  useEffect(() => {
    if (!selectedCommunityId && sortedCommunities.length > 0) {
      setSelectedCommunityId(sortedCommunities[0].id);
    }
  }, [sortedCommunities, selectedCommunityId]);

  const isLoading = loadingCommunities || loadingMessages || loadingUsers || loadingSentMessages;
  const error = communitiesError || messagesError || usersError || sentMessagesError;
  
  return (
    <div className={styles.landingPage}>
      <div className={styles.sidebar}>
        <header className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>Communities</h2>
          <select 
            className={styles.communitySelect}
            value={selectedCommunityId || ''}
            onChange={(e) => setSelectedCommunityId(e.target.value)}
          >
            {loadingCommunities ? (
              <option value="" disabled>Loading...</option>
            ) : (
              sortedCommunities.map(community => (
                <option key={community.id} value={community.id}>
                  {community.name}
                </option>
              ))
            )}
          </select>
        </header>
        <div className={styles.usersList}>
          {isLoading && !inboxData ? (
            <LoadingSpinner text="Fetching conversations..." />
          ) : error ? (
            <ErrorDisplay message={error.message} />
          ) : !inboxData || inboxData.users.length === 0 ? (
            <div className={styles.emptyState}>
              {isLoading || !selectedCommunityId ? 'Loading...' : 'No conversations in this community.'}
            </div>
          ) : (
            <ul className={styles.usersListItems}>
              {inboxData.users.map(user => (
                <li key={user.userId}>
                  <button
                    onClick={() => setSelectedUser(user)}
                    className={`${styles.userItem} ${selectedUser?.userId === user.userId ? styles.selectedUser : ''}`}
                  >
                    <div className={styles.userInfo}>
                      <div className={styles.userAvatar}>
                        {user.profileImage ? (
                          <Image 
                            src={user.profileImage} 
                            alt={user.name} 
                            width={40} 
                            height={40} 
                            className={styles.avatarImage}
                          />
                        ) : (
                          <div className={styles.avatarFallback}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className={styles.userDetails}>
                        <p className={styles.userName}>{user.name}</p>
                        <p className={styles.userPhone}>{user.phoneNumber}</p>
                      </div>
                    </div>

                    {user.messages.length > 0 && (
                      <p className={styles.lastMessage}>
                        {user.messages[0].text || '[Media Message]'}
                      </p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <main className={styles.mainContent}>
        {selectedUser ? (
          <>
            <header className={styles.conversationHeader}>
              <div className={styles.selectedUserInfo}>
                <div className={styles.userAvatar}>
                  {selectedUser.profileImage ? (
                    <Image 
                      src={selectedUser.profileImage} 
                      alt={selectedUser.name} 
                      width={56} 
                      height={56} 
                      className={styles.avatarImage}
                    />
                  ) : (
                    <div className={styles.avatarFallback}>
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className={styles.userDetails}>
                  <h3 className={styles.userName}>{selectedUser.name}</h3>
                  <p className={styles.userPhone}>{selectedUser.phoneNumber}</p>
                </div>
              </div>
              <Link href="/dashboard" className={styles.dashboardLink}>
                Go to Dashboard
              </Link>
            </header>
            <div className={styles.messagesContainer}>
              <div className={styles.messagesList}>
                {fullConversation.map(message => {
                  const isSentByUser = message.sender === selectedUser.userId;
                  
                  return (
                    <div 
                      key={message.id} 
                      className={`${styles.messageItem} ${isSentByUser ? styles.userMessage : styles.adminMessage}`}
                    >
                      {!isSentByUser && (
                        <div className={styles.messageAvatar}>
                          <div className={styles.avatarFallback}>A</div>
                        </div>
                      )}
                      <div className={styles.messageWrapper}>
                        <div className={styles.messageBubble}>
                          <MessageContent message={message} />
                        </div>
                        <p className={styles.messageTime}>
                          {formatDate(message.createdAt)}
                        </p>
                      </div>
                      {isSentByUser && (
                        <div className={styles.messageAvatar}>
                          {selectedUser.profileImage ? (
                            <Image 
                              src={selectedUser.profileImage} 
                              alt={selectedUser.name} 
                              width={32} 
                              height={32} 
                              className={styles.avatarImage}
                            />
                          ) : (
                            <div className={styles.avatarFallback}>
                              {selectedUser.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className={styles.emptyConversation}>
            <MessageSquare className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>
              {isLoading ? "Loading..." : selectedCommunityId ? 'Select a user to view their conversation' : 'Select a Community'}
            </p>
            <p className={styles.emptySubtitle}>
              {isLoading || !selectedCommunityId ? 'Choose from the dropdown to view conversations.' : 'There are no messages for this community, or no user is selected.'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
