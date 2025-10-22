'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { MessageSquare, Search, Send, Loader2, ServerCrash, User, Crown } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, DocumentData, doc, getDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import SimpleMembersList, { Member } from '@/components/dashboard/SimpleMembersList';
import styles from './MessagesPage.module.scss';

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

function RoleIcon({ role }: { role?: string }) {
  switch (role?.toLowerCase()) {
    case 'admin':
    case 'commu_leader':
      return <Crown className="w-5 h-5 text-yellow-500" />;
    case 'user':
      return <User className="w-5 h-5 text-blue-500" />;
    default:
      return <User className="w-5 h-5 text-gray-500" />;
  }
}

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
  return (
    <div className={styles.messageContent}>
      {message.messageType === 'image' && message.image?.url ? (
        <div className={styles.imageContainer}>
          <img 
            src={message.image.url} 
            alt={message.image.caption || 'Image message'} 
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

// --- MAIN MESSAGES PAGE ---
export default function MessagesPage() {
  const firestore = useFirestore();
  const params = useParams();
  const communityId = params?.communityId as string;

  const [selectedUser, setSelectedUser] = useState<UserWithMessages | null>(null);
  const [inboxData, setInboxData] = useState<InboxData | null>(null);
  const [fullConversation, setFullConversation] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState<string>('');
  const [community, setCommunity] = useState<Community | null>(null);
  const [communityMembers, setCommunityMembers] = useState<Member[]>([]);

  // Fetch community data directly
  useEffect(() => {
    const fetchCommunityData = async () => {
      if (!firestore || !communityId) return;
      
      try {
        const communityDocRef = doc(firestore, 'communities', communityId);
        const communityDoc = await getDoc(communityDocRef);
        
        if (communityDoc.exists()) {
          const communityData = communityDoc.data() as Community;
          setCommunity({
            ...communityData,
            id: communityDoc.id,
          });
          console.log("Community data loaded:", communityData.name);
        } else {
          console.error("Community not found");
        }
      } catch (err) {
        console.error('Error fetching community data:', err);
      }
    };
    
    fetchCommunityData();
  }, [firestore, communityId]);

  // Query for ALL messages (not filtered by community)
  const messagesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'messages');
  }, [firestore]);
  const { data: allMessages, isLoading: loadingMessages, error: messagesError } = useCollection<Message>(messagesQuery);

  // Query for ALL sent messages
  const sentMessagesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'sendwamessagehistories');
  }, [firestore]);
  const { data: allSentMessages, isLoading: loadingSentMessages, error: sentMessagesError } = useCollection<Message>(sentMessagesQuery);
  
  // Query for ALL users
  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);
  const { data: allUsers, isLoading: loadingUsers, error: usersError } = useCollection<UserProfile>(usersQuery);
  
  // Extract community members for the members list with last message timestamp
  useEffect(() => {
    if (!allUsers || !allMessages || !allSentMessages) return;
    
    // Use a more efficient approach to process messages
    const processMembers = () => {
      console.time('process-members');
      
      // Get all messages for this community
      const communityMessages = allMessages.filter(msg => msg.community === communityId);
      const communitySentMessages = allSentMessages.filter(msg => msg.community === communityId);
      
      // Create a map of user IDs to their last message timestamp
      const userLastMessageMap = new Map<string, number>();
      
      // Process received messages
      for (const msg of communityMessages) {
        const timestamp = msg.createdAt?.seconds || 0;
        
        // Check sender
        if (msg.sender) {
          const currentTimestamp = userLastMessageMap.get(msg.sender) || 0;
          if (timestamp > currentTimestamp) {
            userLastMessageMap.set(msg.sender, timestamp);
          }
        }
        
        // Check readBy
        if (msg.readBy) {
          for (const r of msg.readBy) {
            const currentTimestamp = userLastMessageMap.get(r.userId) || 0;
            if (timestamp > currentTimestamp) {
              userLastMessageMap.set(r.userId, timestamp);
            }
          }
        }
      }
      
      // Process sent messages
      for (const msg of communitySentMessages) {
        const timestamp = msg.createdAt?.seconds || 0;
        
        // Check sender
        if (msg.sender) {
          const currentTimestamp = userLastMessageMap.get(msg.sender) || 0;
          if (timestamp > currentTimestamp) {
            userLastMessageMap.set(msg.sender, timestamp);
          }
        }
        
        // Check readBy
        if (msg.readBy) {
          for (const r of msg.readBy) {
            const currentTimestamp = userLastMessageMap.get(r.userId) || 0;
            if (timestamp > currentTimestamp) {
              userLastMessageMap.set(r.userId, timestamp);
            }
          }
        }
      }
      
      // Create member objects with last message timestamp
      const members = allUsers.map(user => ({
        id: user.id,
        fullName: user.fullName || user.name || user.displayName || 'Unknown User',
        email: user.email,
        phoneNumber: user.phoneNumber || user.phone || user.waNumber || '',
        profileImage: user.profileImage,
        role: user.role || 'user',
        status: 'active' as const,
        lastMessageTimestamp: userLastMessageMap.get(user.id)
      }));
      
      console.timeEnd('process-members');
      return members;
    };
    
    // Use requestIdleCallback if available, otherwise use setTimeout
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      // @ts-ignore
      window.requestIdleCallback(() => {
        const members = processMembers();
        setCommunityMembers(members);
      });
    } else {
      setTimeout(() => {
        const members = processMembers();
        setCommunityMembers(members);
      }, 0);
    }
  }, [allUsers, allMessages, allSentMessages, communityId]);

  // Process data when dependencies change
  useEffect(() => {
    if (!communityId || !allMessages || !allUsers || !community || !allSentMessages) {
      console.log("Missing data:", {
        communityId: !!communityId,
        allMessages: !!allMessages,
        allUsers: !!allUsers,
        community: !!community,
        allSentMessages: !!allSentMessages
      });
      return;
    }

    console.log('Processing messages data:', {
      communityId,
      messages: allMessages.length,
      sentMessages: allSentMessages.length,
      users: allUsers.length
    });

    // Filter messages for this community
    const communityMessages = allMessages.filter(msg => msg.community === communityId);
    const communitySentMessages = allSentMessages.filter(msg => msg.community === communityId);
    const combinedCommunityMessages = [...communityMessages, ...communitySentMessages];
    
    console.log(`Found ${communityMessages.length} received messages and ${communitySentMessages.length} sent messages for community`);
    
    // Create a set of user IDs who have sent or received a message in this community
    const usersInvolved = new Set<string>();
    combinedCommunityMessages.forEach(msg => {
      if (msg.sender) usersInvolved.add(msg.sender);
      msg.readBy?.forEach(r => usersInvolved.add(r.userId));
    });
    
    console.log(`Found ${usersInvolved.size} users involved in messages`);
    
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
          name: user.fullName || user.name || user.displayName || 'Unknown User',
          phoneNumber: user.phoneNumber || user.phone || user.waNumber || 'Unknown Phone',
          role: user.role || 'user',
          profileImage: user.profileImage,
          messages: userMessages,
          _raw: user,
        } as UserWithMessages;
      })
      .filter((u): u is UserWithMessages => !!u);

    // Sort users by most recent message
    responseUsers.sort((a, b) => {
      const lastMsgTimeA = a.messages[0]?.createdAt?.seconds || 0;
      const lastMsgTimeB = b.messages[0]?.createdAt?.seconds || 0;
      return lastMsgTimeB - lastMsgTimeA;
    });
    
    console.log(`Processed ${responseUsers.length} users with messages`);
    
    setInboxData({
      communityName: community.name,
      users: responseUsers,
    });
    
    // Check if currently selected user still exists in the filtered list
    let currentUserStillExists = selectedUser ? responseUsers.find(u => u.userId === selectedUser.userId) : null;
    
    // If not, select the first user in the list
    if (!currentUserStillExists && responseUsers.length > 0) {
      currentUserStillExists = responseUsers[0];
      console.log("Auto-selecting first user:", currentUserStillExists.name);
    }
    
    if (currentUserStillExists) {
      setSelectedUser(currentUserStillExists);
      
      // Load the full conversation for the selected user
      const conversationMessages = combinedCommunityMessages.filter(msg => 
        (msg.readBy?.some(r => r.userId === currentUserStillExists!.userId)) || (msg.sender === currentUserStillExists!.userId)
      );
      
      // Sort messages by creation time (oldest first)
      conversationMessages.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      console.log(`Loaded ${conversationMessages.length} messages for conversation with ${currentUserStillExists.name}`);
      setFullConversation(conversationMessages);
    } else {
      setSelectedUser(null);
      setFullConversation([]);
    }
  }, [communityId, allMessages, allSentMessages, allUsers, community, selectedUser]);


  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedUser) return;
    
    // Here you would add the message to Firestore
    console.log(`Sending message to ${selectedUser.name}: ${messageText}`);
    
    // Clear input
    setMessageText('');
  };

  const handleSelectUser = (user: UserWithMessages | Member) => {
    // If the user is from the members list, we need to find their corresponding UserWithMessages
    if (!('messages' in user)) {
      const userWithMessages = inboxData?.users.find(u => u.userId === user.id);
      if (userWithMessages) {
        setSelectedUser(userWithMessages);
        
        // Load the full conversation for the selected user
        if (allMessages && allSentMessages) {
          const communityMessages = allMessages.filter(msg => msg.community === communityId);
          const communitySentMessages = allSentMessages.filter(msg => msg.community === communityId);
          const combinedCommunityMessages = [...communityMessages, ...communitySentMessages];
          
          const conversationMessages = combinedCommunityMessages.filter(msg => 
            (msg.readBy?.some(r => r.userId === userWithMessages.userId)) || (msg.sender === userWithMessages.userId)
          );
          
          // Sort messages by creation time (oldest first)
          conversationMessages.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
          console.log(`Loaded ${conversationMessages.length} messages for conversation with ${userWithMessages.name}`);
          setFullConversation(conversationMessages);
        }
      } else {
        // This member doesn't have any messages yet
        setSelectedUser({
          userId: user.id,
          name: user.fullName || '',
          phoneNumber: user.phoneNumber || '',
          role: user.role || 'user',
          profileImage: user.profileImage,
          messages: [],
          _raw: {
            id: user.id,
            fullName: user.fullName,
            phoneNumber: user.phoneNumber,
            role: user.role,
            profileImage: user.profileImage
          } as UserProfile
        });
        setFullConversation([]);
      }
    } else {
      setSelectedUser(user);
      
      // Load the full conversation for the selected user
      if (allMessages && allSentMessages) {
        const communityMessages = allMessages.filter(msg => msg.community === communityId);
        const communitySentMessages = allSentMessages.filter(msg => msg.community === communityId);
        const combinedCommunityMessages = [...communityMessages, ...communitySentMessages];
        
        const conversationMessages = combinedCommunityMessages.filter(msg => 
          (msg.readBy?.some(r => r.userId === user.userId)) || (msg.sender === user.userId)
        );
        
        // Sort messages by creation time (oldest first)
        conversationMessages.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
        console.log(`Loaded ${conversationMessages.length} messages for conversation with ${user.name}`);
        setFullConversation(conversationMessages);
      } else {
        setFullConversation([]);
      }
    }
  };

  const isLoading = loadingMessages || loadingUsers || loadingSentMessages || !community;
  const error = messagesError || sentMessagesError || usersError;

  return (
    <div className={styles.messagesContainer}>
      <div className={styles.membersList}>
        <SimpleMembersList 
          members={communityMembers}
          onSelectMember={handleSelectUser}
          selectedMemberId={selectedUser?.userId}
          className={styles.simpleMembersList}
          isLoading={isLoading}
        />
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
          <div className={styles.emptyConversationState}>
            <MessageSquare className={styles.emptyConversationStateIcon} />
            <h3>Select a conversation</h3>
            <p>Choose a user from the list to view their messages</p>
          </div>
        )}
      </div>
    </div>
  );
}
