import { getFirestore, collection, query, where, getDocs } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';

// Initialize Firebase Admin SDK
const adminApp = getFirebaseAdminApp();
const firestore = getFirestore(adminApp);

export async function POST(request: Request) {
  try {
    const { userId, channelIds } = await request.json();

    if (!userId || !channelIds) {
      return NextResponse.json({ error: 'User ID and Channel IDs are required.' }, { status: 400 });
    }

    if (channelIds.length === 0) {
      // If there are no channels, there can be no messages. Return empty array.
      return NextResponse.json({ messages: [] });
    }
    
    // Firestore 'in' queries are limited to 30 clauses. 
    // We chunk the channelIds to handle cases with more than 30 channels.
    const MAX_IN_CLAUSES = 30;
    const channelIdChunks: string[][] = [];
    for (let i = 0; i < channelIds.length; i += MAX_IN_CLAUSES) {
        channelIdChunks.push(channelIds.slice(i, i + MAX_IN_CLAUSES));
    }
    
    const messages: any[] = [];
    
    // Execute a query for each chunk of channel IDs
    for (const chunk of channelIdChunks) {
        const messagesQuery = query(
            collection(firestore, 'messages'),
            where('sender', '==', userId),
            where('channel', 'in', chunk)
        );
    
        const snapshot = await getDocs(messagesQuery);
        snapshot.forEach(doc => {
            messages.push({ id: doc.id, ...doc.data() });
        });
    }

    // Sort messages by creation date, handling different date formats
    messages.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;

        // Helper to convert Firestore Timestamps or date strings into Date objects
        const toDate = (timestamp: any): Date => {
            if (timestamp && typeof timestamp === 'object' && timestamp._seconds) {
                return new Date(timestamp._seconds * 1000);
            }
            return new Date(timestamp); // Works for ISO strings and Date objects
        };

        const dateA = toDate(a.createdAt);
        const dateB = toDate(b.createdAt);

        // Check for invalid dates
        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
            return 0;
        }

        return dateB.getTime() - dateA.getTime(); // Sort descending
    });


    return NextResponse.json({ messages });

  } catch (error: any) {
    console.error("Failed to fetch member messages:", error);
    return NextResponse.json({ error: `Failed to fetch messages: ${error.message}` }, { status: 500 });
  }
}
