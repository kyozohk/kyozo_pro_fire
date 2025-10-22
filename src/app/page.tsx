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
      return <Crown className="w-5 h-5 text-yellow-500" />;
    case 'user':
      return <User className="w-5 h-5 text-blue-500" />;
    default:
      return <User className="w-5 h-5 text-gray-500" />;
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
      <p className="text-sm font-mono bg-destructive/10 p-2 rounded-md">{message}</p>
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
                    <Button variant="outline" className="w-full">
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
                             <Button variant="secondary" className="w-full justify-start">
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
    <div className="flex h-screen bg-background text-foreground font-body">
      <div className="w-full md:w-[380px] border-r h-full flex flex-col">
        <header className="p-4 border-b flex-shrink-0 flex items-center gap-2">
            <Link href="/">
                <Button variant="ghost" size="icon">
                    <ArrowLeft />
                </Button>
            </Link>
            <Select value={selectedCommunityId || ''} onValueChange={setSelectedCommunityId}>
              <SelectTrigger className="w-full h-14 text-base">
                <SelectValue placeholder="Select a community..." />
              </SelectTrigger>
              <SelectContent>
                {loadingCommunities ? <SelectItem value="loading" disabled>Loading...</SelectItem> :
                  sortedCommunities.map(community => (
                    <SelectItem key={community.id} value={community.id}>
                       <div className="flex items-center gap-3">
                         <Avatar className="h-10 w-10">
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
        <div className="flex-1 overflow-y-auto">
          {isLoading && !inboxData ? (
            <LoadingSpinner text="Fetching conversations..." />
          ) : error ? (
            <ErrorDisplay message={error.message} />
          ) : !inboxData || inboxData.users.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground mt-8">
                {isLoading || !selectedCommunityId ? 'Loading...' : 'No conversations in this community.'}
            </div>
          ) : (
            <ul>
              {inboxData.users.map(user => (
                <li key={user.userId}>
                  <button
                    onClick={() => setSelectedUser(user)}
                    className={cn('w-full text-left p-4 border-b hover:bg-muted/50 transition-colors', selectedUser?.userId === user.userId ? 'bg-muted' : '')}
                  >
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                {user.profileImage ? (
                                    <AvatarImage src={user.profileImage} alt={user.name} />
                                ) : (
                                    <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                                )}
                            </Avatar>
                            <div>
                                <p className="font-semibold">{user.name}</p>
                                <p className="text-sm text-muted-foreground">{user.phoneNumber}</p>
                            </div>
                        </div>
                        <RoleIcon role={user.role} />
                    </div>

                    {user.messages.length > 0 && (
                        <p className="text-xs text-muted-foreground truncate mt-2 pl-12">{user.messages[0].text || '[Media/Template Message]'}</p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <main className="flex-1 h-full flex flex-col bg-muted/30">
        {selectedUser ? (
          <>
            <header className="p-4 border-b bg-background flex-shrink-0">
                <div className="flex items-start gap-3">
                    <Avatar className="h-14 w-14">
                        {selectedUser.profileImage ? (
                            <AvatarImage src={selectedUser.profileImage} alt={selectedUser.name} />
                        ) : (
                            <AvatarFallback className="text-xl">{selectedUser.name?.charAt(0) || 'U'}</AvatarFallback>
                        )}
                    </Avatar>
                    <div className="flex-1">
                        <h3 className="font-semibold text-lg">{selectedUser.name}</h3>
                        <p className="text-sm text-muted-foreground">{selectedUser.phoneNumber}</p>
                    </div>
                </div>
                 <Accordion type="single" collapsible className="w-full mt-2">
                    <AccordionItem value="item-1">
                        <AccordionTrigger className="text-xs">View Full Conversation JSON</AccordionTrigger>
                        <AccordionContent>
                            <pre className="p-2 bg-muted text-xs rounded-md overflow-auto max-h-40">
                                {JSON.stringify(fullConversation, null, 2)}
                            </pre>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </header>
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4 max-w-3xl mx-auto">
                {fullConversation.map(message => {
                  const isSentByUser = message.sender === selectedUser.userId;
                  
                  return (
                    <div key={message.id} className={cn("flex items-end gap-2 w-full", isSentByUser ? "justify-end" : "justify-start")}>
                        {!isSentByUser && (
                             <Avatar className="h-8 w-8">
                                <AvatarFallback>A</AvatarFallback>
                           </Avatar>
                        )}
                        <div className="flex-grow-0">
                             <div className={cn(
                                "p-3 rounded-lg w-full max-w-md text-left",
                                isSentByUser ? "bg-primary text-primary-foreground" : "bg-background"
                            )}>
                                <MessageContent message={message}/>
                            </div>
                            <p className={cn("text-xs text-muted-foreground mt-1", isSentByUser ? "text-right" : "text-left")}>
                                {formatDate(message.createdAt)}
                            </p>
                        </div>
                        {isSentByUser && (
                            <Avatar className="h-8 w-8">
                                {selectedUser.profileImage ? (
                                    <AvatarImage src={selectedUser.profileImage} alt={selectedUser.name} />
                                ) : (
                                    <AvatarFallback>{selectedUser.name.charAt(0).toUpperCase()}</AvatarFallback>
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
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-center p-8">
                <Inbox className="h-16 w-16" />
                <p className="mt-4 text-lg font-semibold">
                    {isLoading ? "Loading..." : selectedCommunityId ? 'Select a user to view their conversation' : 'Select a Community'}
                </p>
                <p className="text-sm">
                    {isLoading || !selectedCommunityId ? 'Choose from the dropdown to view conversations.' : 'There are no messages for this community, or no user is selected.'}
                </p>
            </div>
        )}
      </main>
    </div>
  );
}
