import { getFirestore, collection, getDocs, writeBatch, doc, deleteDoc } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';

// Initialize Firebase Admin SDK
const adminApp = getFirebaseAdminApp();
const firestore = getFirestore(adminApp);


async function deleteCollection(collectionPath: string, batchSize: number): Promise<void> {
    const collectionRef = firestore.collection(collectionPath);
    const query = collectionRef.limit(batchSize);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(query, resolve).catch(reject);
    });
}

async function deleteQueryBatch(query: FirebaseFirestore.Query, resolve: () => void): Promise<void> {
    const snapshot = await query.get();

    const batchSize = snapshot.size;
    if (batchSize === 0) {
        // When there are no documents left, we are done
        resolve();
        return;
    }

    // Delete documents in a batch
    const batch = firestore.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    // Recurse on the next process tick, to avoid
    // exploding the stack.
    process.nextTick(() => {
        deleteQueryBatch(query, resolve);
    });
}


export async function POST(request: Request) {
  const { userId, communityId } = await request.json();

  if (!userId || !communityId) {
    return NextResponse.json({ error: 'User ID and Community ID are required.' }, { status: 400 });
  }

  try {
    const communityRef = doc(firestore, 'users', userId, 'communities', communityId);
    const membersRef = collection(communityRef, 'members');
    
    // Get all member documents
    const membersSnapshot = await getDocs(membersRef);
    
    // Use a single large batch for all deletions
    const batch = firestore.batch();

    for (const memberDoc of membersSnapshot.docs) {
      // For each member, find and delete all their messages
      const messagesRef = collection(memberDoc.ref, 'messages');
      const messagesSnapshot = await getDocs(messagesRef);
      messagesSnapshot.forEach(messageDoc => {
        batch.delete(messageDoc.ref);
      });
      
      // Delete the member document itself
      batch.delete(memberDoc.ref);
    }
    
    // Finally, delete the community document
    batch.delete(communityRef);

    // Commit all deletions in one atomic operation
    await batch.commit();

    return NextResponse.json({ message: 'Community and all subcollections deleted successfully.' });

  } catch (error: any) {
    console.error("Failed to delete community from Firestore:", error);
    return NextResponse.json({ error: `Failed to delete data: ${error.message}` }, { status: 500 });
  }
}
