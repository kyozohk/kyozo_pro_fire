'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, DocumentData, orderBy } from 'firebase/firestore';
import { CommunityPageLayout } from '@/components/dashboard';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, ServerCrash, MessageSquare, FileText, User, Crown } from 'lucide-react';
import { ButtonV2 } from '@/components/ui';
import styles from './MessagesPage.module.scss';

// Types
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
  template?: { 
    text?: string;
    whatsAppTemplate?: {
      components: TemplateComponent[];
      language_code: string;
      name: string;
    };
  }; 
}

interface TemplateComponent {
  type: 'body' | 'header' | 'footer' | 'buttons';
  text?: string;
  format?: 'text' | 'image' | 'document' | 'button';
  documentUrl?: string;
  buttons?: {
    type: 'url';
    text: string;
    url: string;
  }[];
}

interface UserProfile extends DocumentData {
  id: string;
  fullName?: string;
  name?: string;
  displayName?: string;
  phoneNumber?: string;
  phone?: string;
  waNumber?: string;
  role?: string;
  profileImage?: string;
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

// Helper functions
const formatDate = (date: any) => {
  if (!date) return '';
  if (date && (date.seconds || date._seconds)) {
    const seconds = date.seconds || date._seconds;
    return format(new Date(seconds * 1000), "HH:mm • dd/MMM/yyyy");
  }
  return format(new Date(date), "HH:mm • dd/MMM/yyyy");
};

const getDisplayName = (user: UserProfile): string => {
  return user.fullName || user.name || user.displayName || 'Unknown User';
};

const getPhoneNumber = (user: UserProfile): string => {
  return user.phoneNumber || user.phone || user.waNumber || '';
};

const RoleIcon = ({ role }: { role?: string }) => {
  switch (role?.toLowerCase()) {
    case 'admin':
    case 'commu_leader':
      return <Crown className="w-5 h-5 text-yellow-500" />;
    case 'user':
      return <User className="w-5 h-5 text-blue-500" />;
    default:
      return <User className="w-5 h-5 text-gray-500" />;
  }
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
      <p className={styles.errorTitle}>An Error Occurred</p>
      <p className={styles.errorMessage}>{message}</p>
    </div>
  );
}

function MessageContent({ message }: { message: Message }) {
  let messageText = message.text;
  const templateComponents = message.template?.whatsAppTemplate?.components;

  let bodyComponent: TemplateComponent | undefined;
  let headerComponent: TemplateComponent | undefined;
  let footerComponent: TemplateComponent | undefined;
  let buttonComponents: TemplateComponent | undefined;

  if (templateComponents) {
    bodyComponent = templateComponents.find(c => c.type === 'body');
    headerComponent = templateComponents.find(c => c.type === 'header');
    footerComponent = templateComponents.find(c => c.type === 'footer');
    buttonComponents = templateComponents.find(c => c.type === 'buttons');

    if (!messageText && bodyComponent?.text) {
      messageText = bodyComponent.text;
    } else if (!messageText && headerComponent?.text) {
      messageText = headerComponent.text;
    }
  }
  
  return (
    <div className={styles.messageContent}>
      {headerComponent?.format === 'document' && headerComponent.documentUrl && (
        <a href={headerComponent.documentUrl} target="_blank" rel="noopener noreferrer" className={styles.documentLink}>
          <ButtonV2 variant="outline" className={styles.documentButton}>
            <FileText className={styles.documentIcon} />
            View Document
          </ButtonV2>
        </a>
      )}
      
      {message.messageType === 'image' && message.image?.url ? (
        <div className={styles.imageContainer}>
          <img src={message.image.url} alt={message.image.caption || 'Image message'} className={styles.messageImage} />
          {message.image.caption && <p className={styles.imageCaption}>{message.image.caption}</p>}
        </div>
      ) : (
        <p className={styles.messageText}>{messageText || <span className={styles.emptyMessage}>[Empty or Unrecognized Message Format]</span>}</p>
      )}

      {footerComponent?.text && (
        <p className={styles.messageFooter}>{footerComponent.text}</p>
      )}

      {buttonComponents?.buttons && (
        <div className={styles.messageButtons}>
          {buttonComponents.buttons.map((button, index) => (
            <a key={index} href={button.url} target="_blank" rel="noopener noreferrer">
              <ButtonV2 variant="outline" className={styles.messageButton}>
                {button.text}
              </ButtonV2>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  const params = useParams();
  const communityId = params.communityId as string;
  const firestore = useFirestore();
  
  const [selectedUser, setSelectedUser] = useState<UserWithMessages | null>(null);
  const [fullConversation, setFullConversation] = useState<Message[]>([]);
  const [users, setUsers] = useState<UserWithMessages[]>([]);

  // Query for messages
  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !communityId) return null;
    return query(
      collection(firestore, 'messages'),
      where('community', '==', communityId),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, communityId]);
  
  const { data: allMessages, isLoading: loadingMessages, error: messagesError } = useCollection<Message>(messagesQuery);

  // Query for sent messages
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

  // Process messages and users
  useEffect(() => {
    if (!allMessages || !allSentMessages || !allUsers) return;

    // Combine received and sent messages for the community
    const combinedMessages = [...(allMessages || []), ...(allSentMessages || [])];
    
    // Create a set of user IDs who have sent or received a message in this community
    const usersInvolved = new Set<string>();
    combinedMessages.forEach(msg => {
      if (msg.sender) usersInvolved.add(msg.sender);
      msg.readBy?.forEach(r => usersInvolved.add(r.userId));
    });
    
    const usersMap = new Map(allUsers.map(user => [user.id, user]));

    const usersList: UserWithMessages[] = Array.from(usersInvolved).map(userId => {
      const user = usersMap.get(userId);
      if (!user) return null;

      const userMessages = combinedMessages.filter(msg => 
        msg.readBy?.some(r => r.userId === userId) || msg.sender === userId
      );

      if (userMessages.length === 0) return null;

      userMessages.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

      return {
        userId: userId,
        name: getDisplayName(user),
        phoneNumber: getPhoneNumber(user),
        role: user.role || 'user',
        profileImage: user.profileImage,
        messages: userMessages,
        _raw: user,
      };
    }).filter((u): u is UserWithMessages => !!u);

    usersList.sort((a, b) => {
      const lastMsgTimeA = a.messages[0]?.createdAt?.seconds || 0;
      const lastMsgTimeB = b.messages[0]?.createdAt?.seconds || 0;
      return lastMsgTimeB - lastMsgTimeA;
    });
    
    setUsers(usersList);
    
    if (usersList.length > 0 && !selectedUser) {
      setSelectedUser(usersList[0]);
    }
  }, [allMessages, allSentMessages, allUsers, communityId]);

  // Load conversation for selected user
  useEffect(() => {
    if (!selectedUser || !allMessages || !allSentMessages) return;
    
    const combinedMessages = [...(allMessages || []), ...(allSentMessages || [])];
    
    // Filter messages for the selected user
    const conversationMessages = combinedMessages.filter(msg => 
      (msg.readBy?.some(r => r.userId === selectedUser.userId)) || (msg.sender === selectedUser.userId)
    );
    
    // Sort by timestamp
    conversationMessages.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
    
    setFullConversation(conversationMessages);
  }, [selectedUser, allMessages, allSentMessages]);

  const isLoading = loadingMessages || loadingSentMessages || loadingUsers;
  const error = messagesError || sentMessagesError || usersError;

  return (
    <CommunityPageLayout showBanner={false}>
      <div className={styles.messagesContainer}>
        <div className={styles.usersList}>
          <div className={styles.usersHeader}>
            <h2 className={styles.usersTitle}>Messages</h2>
            <p className={styles.usersSubtitle}>Community conversations</p>
          </div>
          
          {isLoading && users.length === 0 ? (
            <LoadingSpinner text="Loading conversations..." />
          ) : error ? (
            <ErrorDisplay message={error.message} />
          ) : users.length === 0 ? (
            <div className={styles.emptyState}>
              <MessageSquare className={styles.emptyStateIcon} />
              <p>No conversations in this community.</p>
            </div>
          ) : (
            <ul className={styles.userList}>
              {users.map(user => (
                <li key={user.userId} className={styles.userItem}>
                  <button
                    onClick={() => setSelectedUser(user)}
                    className={`${styles.userButton} ${selectedUser?.userId === user.userId ? styles.active : ''}`}
                  >
                    <div className={styles.userInfo}>
                      <Avatar className={styles.userAvatar}>
                        {user.profileImage ? (
                          <AvatarImage src={user.profileImage} alt={user.name} />
                        ) : (
                          <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                        )}
                      </Avatar>
                      <div className={styles.userDetails}>
                        <div className={styles.userName}>
                          <span>{user.name}</span>
                          <RoleIcon role={user.role} />
                        </div>
                        <p className={styles.userPhone}>{user.phoneNumber}</p>
                        {user.messages.length > 0 && (
                          <p className={styles.messagePreview}>
                            {user.messages[0].text || '[Media/Template Message]'}
                          </p>
                        )}
                      </div>
                    </div>
                    {user.messages.length > 0 && (
                      <span className={styles.messageTime}>
                        {formatDate(user.messages[0].createdAt)}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className={styles.conversation}>
          {selectedUser ? (
            <>
              <div className={styles.conversationHeader}>
                <Avatar className={styles.conversationAvatar}>
                  {selectedUser.profileImage ? (
                    <AvatarImage src={selectedUser.profileImage} alt={selectedUser.name} />
                  ) : (
                    <AvatarFallback>{selectedUser.name.charAt(0).toUpperCase()}</AvatarFallback>
                  )}
                </Avatar>
                <div className={styles.conversationUser}>
                  <h3 className={styles.conversationName}>{selectedUser.name}</h3>
                  <p className={styles.conversationPhone}>{selectedUser.phoneNumber}</p>
                </div>
              </div>
              
              <div className={styles.conversationBody}>
                {fullConversation.length === 0 ? (
                  <div className={styles.emptyConversation}>
                    <MessageSquare className={styles.emptyConversationIcon} />
                    <p>No messages in this conversation.</p>
                  </div>
                ) : (
                  fullConversation.map(message => {
                    const isSentByUser = message.sender === selectedUser.userId;
                    
                    return (
                      <div 
                        key={message.id} 
                        className={`${styles.messageWrapper} ${isSentByUser ? styles.userMessage : styles.systemMessage}`}
                      >
                        {!isSentByUser && (
                          <Avatar className={styles.messageAvatar}>
                            <AvatarFallback>A</AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div className={styles.message}>
                          <div className={`${styles.messageBubble} ${isSentByUser ? styles.userBubble : styles.systemBubble}`}>
                            <MessageContent message={message} />
                          </div>
                          <span className={styles.messageTime}>
                            {formatDate(message.createdAt)}
                          </span>
                        </div>
                        
                        {isSentByUser && (
                          <Avatar className={styles.messageAvatar}>
                            {selectedUser.profileImage ? (
                              <AvatarImage src={selectedUser.profileImage} alt={selectedUser.name} />
                            ) : (
                              <AvatarFallback>{selectedUser.name.charAt(0).toUpperCase()}</AvatarFallback>
                            )}
                          </Avatar>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div className={styles.emptyConversationState}>
              <MessageSquare className={styles.emptyConversationStateIcon} />
              <h3>Select a conversation</h3>
              <p>Choose a user from the list to view their messages</p>
            </div>
          )}
        </div>
      </div>
    </CommunityPageLayout>
  );
}
