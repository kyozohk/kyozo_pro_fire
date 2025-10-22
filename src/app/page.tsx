'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Loader2, Inbox, ServerCrash, ArrowLeft, Link as LinkIcon, FileText, User, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, DocumentData } from 'firebase/firestore';
import type { WithId } from '@/firebase/firestore/use-collection';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"


// --- TYPES ---
interface Community extends DocumentData {
  id: string;
  name: string;
  communityProfileImage?: string;
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

const RoleIcon = ({ role }: { role?: string }) => {
  switch (role?.toLowerCase()) {
    case 'admin':
    case 'commu_leader':
      return <Crown className="w-5 h-5" style={{ color: '#f59e0b' }} />;
    case 'user':
      return <User className="w-5 h-5" style={{ color: '#3b82f6' }} />;
    default:
      return <User className="w-5 h-5" style={{ color: '#6b7280' }} />;
  }
};


function LoadingSpinner({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-lg font-medium">{text}</p>
    </div>
  );
}

function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-destructive">
      <ServerCrash className="h-12 w-12" />
      <p className="text-lg font-medium">An Error Occurred</p>
      <p className="text-sm font-mono p-2 rounded-md" style={{ backgroundColor: 'rgba(var(--destructive), 0.1)' }}>{message}</p>
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
        <div className="space-y-2">
            {headerComponent?.format === 'document' && headerComponent.documentUrl && (
                <a href={headerComponent.documentUrl} target="_blank" rel="noopener noreferrer" className="block">
                    <Button variant="outline" className="button button--outline w-full">
                        <FileText className="mr-2 h-4 w-4" />
                        View Document
                    </Button>
                </a>
            )}
            {message.messageType === 'image' && message.image?.url ? (
                <div className="space-y-2">
                    <Image src={message.image.url} alt={message.image.caption || 'Image message'} width={300} height={300} className="rounded-md object-cover border" />
                    {message.image.caption && <p className="text-sm italic">{message.image.caption}</p>}
                </div>
            ) : (
                 <p className="whitespace-pre-wrap">{messageText || <span className="italic">[Empty or Unrecognized Message Format]</span>}</p>
            )}

            {footerComponent?.text && (
                 <p className="text-xs italic pt-2 border-t border-white/20">{footerComponent.text}</p>
            )}

            {buttonComponents?.buttons && (
                <div className="flex flex-col gap-2 pt-2 border-t border-white/20">
                    {buttonComponents.buttons.map((button, index) => (
                        <a key={index} href={button.url} target="_blank" rel="noopener noreferrer">
                             <Button variant="secondary" className="button button--secondary w-full justify-start">
                                 <LinkIcon className="mr-2 h-4 w-4" />
                                {button.text}
                             </Button>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}

// --- MAIN INBOX PAGE ---
export default function InboxPage() {
  const firestore = useFirestore();

  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserWithMessages | null>(null);
  const [inboxData, setInboxData] = useState<InboxData | null>(null);
  const [fullConversation, setFullConversation] = useState<Message[]>([]);


  const communitiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'communities'), where('name', '!=', ''));
  }, [firestore]);
  const { data: communities, isLoading: loadingCommunities, error: communitiesError } = useCollection<Community>(communitiesQuery);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'messages');
  }, [firestore]);
  const { data: allMessages, isLoading: loadingMessages, error: messagesError } = useCollection<Message>(messagesQuery);

  const sentMessagesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'sendwamessagehistories');
  }, [firestore]);
  const { data: allSentMessages, isLoading: loadingSentMessages, error: sentMessagesError } = useCollection<Message>(sentMessagesQuery);
  
  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);
  const { data: allUsers, isLoading: loadingUsers, error: usersError } = useCollection<UserProfile>(usersQuery);

  useEffect(() => {
    if (!selectedCommunityId || !allMessages || !allUsers || !communities || !allSentMessages) {
        setInboxData(null);
        setSelectedUser(null);
        setFullConversation([]);
        return;
    };

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

    const responseUsers: UserWithMessages[] = Array.from(usersInvolved).map(userId => {
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
    }).filter((u): u is UserWithMessages => !!u);

    responseUsers.sort((a, b) => {
        const lastMsgTimeA = a.messages[0]?.createdAt?.seconds || 0;
        const lastMsgTimeB = b.messages[0]?.createdAt?.seconds || 0;
        return lastMsgTimeB - lastMsgTimeA;
    });
    
    setInboxData({
        communityName: selectedCommunity.name,
        users: responseUsers,
    });
    
    let currentUserStillExists = selectedUser ? responseUsers.find(u => u.userId === selectedUser.userId) : null;
    
    if (!currentUserStillExists && responseUsers.length > 0) {
      currentUserStillExists = responseUsers[0];
    }
    
    if (currentUserStillExists) {
        setSelectedUser(currentUserStillExists);
        
        // Load the full conversation for the selected user
        const conversationMessages = combinedCommunityMessages.filter(msg => 
            (msg.readBy?.some(r => r.userId === currentUserStillExists!.userId)) || (msg.sender === currentUserStillExists!.userId)
        );
        conversationMessages.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
        setFullConversation(conversationMessages);
    } else {
        setSelectedUser(null);
        setFullConversation([]);
    }

  }, [selectedCommunityId, allMessages, allSentMessages, allUsers, communities]);


  const sortedCommunities = useMemo(() => {
    if (!communities) return [];
    return [...communities].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [communities]);

  useEffect(() => {
    if (!selectedCommunityId && sortedCommunities.length > 0) {
      setSelectedCommunityId(sortedCommunities[0].id);
    }
  }, [sortedCommunities, selectedCommunityId]);

  const isLoading = loadingCommunities || loadingMessages || loadingUsers || loadingSentMessages;
  const error = communitiesError || messagesError || usersError || sentMessagesError;
  
  return (
    <div className="inbox">
      <div className="inbox__sidebar">
        <header className="inbox__header">
            <Link href="/">
                <Button variant="ghost" size="icon">
                    <ArrowLeft />
                </Button>
            </Link>
            <Select value={selectedCommunityId || ''} onValueChange={setSelectedCommunityId}>
              <SelectTrigger className="select__trigger select__trigger--h14">
                <SelectValue placeholder="Select a community..." />
              </SelectTrigger>
              <SelectContent>
                {loadingCommunities ? <SelectItem value="loading" disabled>Loading...</SelectItem> :
                  sortedCommunities.map(community => (
                    <SelectItem key={community.id} value={community.id}>
                       <div className="flex items-center gap-3">
                         <Avatar className="avatar avatar--md">
                           {community.communityProfileImage ? (
                             <Image src={community.communityProfileImage} alt={community.name} width={40} height={40} className="object-cover" />
                           ) : (
                             <AvatarFallback>{community.name?.charAt(0)}</AvatarFallback>
                           )}
                         </Avatar>
                         <span>{community.name}</span>
                       </div>
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
        </header>
        <div className="inbox__content">
          {isLoading && !inboxData ? (
            <LoadingSpinner text="Fetching conversations..." />
          ) : error ? (
            <ErrorDisplay message={error.message} />
          ) : !inboxData || inboxData.users.length === 0 ? (
            <div className="inbox__empty">
                {isLoading || !selectedCommunityId ? 'Loading...' : 'No conversations in this community.'}
            </div>
          ) : (
            <ul className="inbox__user-list">
              {inboxData.users.map(user => (
                <li key={user.userId}>
                  <button
                    onClick={() => setSelectedUser(user)}
                    className={cn('inbox__user-item', selectedUser?.userId === user.userId ? 'inbox__user-item--selected' : '')}
                  >
                    <div className="inbox__user-header">
                        <div className="inbox__user-info">
                            <Avatar className="avatar">
                                {user.profileImage ? (
                                    <AvatarImage src={user.profileImage} alt={user.name} className="avatar__image" />
                                ) : (
                                    <AvatarFallback className="avatar__fallback">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                                )}
                            </Avatar>
                            <div className="inbox__user-details">
                                <p className="inbox__user-details__name">{user.name}</p>
                                <p className="inbox__user-details__phone">{user.phoneNumber}</p>
                            </div>
                        </div>
                        <RoleIcon role={user.role} />
                    </div>

                    {user.messages.length > 0 && (
                        <p className="inbox__message-preview">{user.messages[0].text || '[Media/Template Message]'}</p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <main className="inbox__main">
        {selectedUser ? (
          <>
            <header className="inbox__conversation-header">
                <div className="inbox__conversation-header__user">
                    <Avatar className="avatar avatar--lg">
                        {selectedUser.profileImage ? (
                            <AvatarImage src={selectedUser.profileImage} alt={selectedUser.name} className="avatar__image" />
                        ) : (
                            <AvatarFallback className="avatar__fallback avatar__fallback--xl">{selectedUser.name?.charAt(0) || 'U'}</AvatarFallback>
                        )}
                    </Avatar>
                    <div className="inbox__conversation-header__details">
                        <h3 className="inbox__conversation-header__details__name">{selectedUser.name}</h3>
                        <p className="inbox__conversation-header__details__phone">{selectedUser.phoneNumber}</p>
                    </div>
                </div>
                 <Accordion type="single" collapsible className="accordion w-full mt-2">
                    <AccordionItem value="item-1" className="accordion__item">
                        <AccordionTrigger className="accordion__trigger accordion__trigger--xs">View Full Conversation JSON</AccordionTrigger>
                        <AccordionContent className="accordion__content">
                            <pre className="p-2 bg-muted text-xs rounded-md overflow-auto max-h-40">
                                {JSON.stringify(fullConversation, null, 2)}
                            </pre>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </header>
            <div className="inbox__messages">
              <div className="inbox__messages__container">
                {fullConversation.map(message => {
                  const isSentByUser = message.sender === selectedUser.userId;
                  
                  return (
                    <div key={message.id} className={cn("inbox__message", isSentByUser ? "inbox__message--sent" : "")}>
                        {!isSentByUser && (
                             <Avatar className="avatar avatar--sm">
                                <AvatarFallback className="avatar__fallback">A</AvatarFallback>
                           </Avatar>
                        )}
                        <div className="inbox__message__content">
                             <div className={cn(
                                "inbox__message__content__bubble",
                                isSentByUser ? "inbox__message__content__bubble--sent" : ""
                            )}>
                                <MessageContent message={message}/>
                            </div>
                            <p className={cn("inbox__message__content__timestamp", 
                              isSentByUser ? "inbox__message__content__timestamp--sent" : "inbox__message__content__timestamp--received")}>
                                {formatDate(message.createdAt)}
                            </p>
                        </div>
                        {isSentByUser && (
                            <Avatar className="avatar avatar--sm">
                                {selectedUser.profileImage ? (
                                    <AvatarImage src={selectedUser.profileImage} alt={selectedUser.name} className="avatar__image" />
                                ) : (
                                    <AvatarFallback className="avatar__fallback">{selectedUser.name.charAt(0).toUpperCase()}</AvatarFallback>
                                )}
                            </Avatar>
                        )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
            <div className="inbox__empty-state">
                <Inbox className="h-16 w-16" />
                <p className="inbox__empty-state__title">
                    {isLoading ? "Loading..." : selectedCommunityId ? 'Select a user to view their conversation' : 'Select a Community'}
                </p>
                <p className="inbox__empty-state__subtitle">
                    {isLoading || !selectedCommunityId ? 'Choose from the dropdown to view conversations.' : 'There are no messages for this community, or no user is selected.'}
                </p>
            </div>
        )}
      </main>
    </div>
  );
}
