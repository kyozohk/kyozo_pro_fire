import { getClient } from '@/lib/mongodb';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';

const MONGO_URI = "mongodb+srv://1234dev28:4testconnect@prod-kyozo-db.8rs1g.mongodb.net/?retryWrites=true&w=majority&appName=prod-kyozo-db";
const DB_NAME = "Prod-Kyozo";

// Helper function to serialize and sort an array of objects
const getComparable = (docs: any[]) => {
    // Stringify and parse to handle complex types (like ObjectId, Date) uniformly
    const serialized = JSON.parse(JSON.stringify(docs));
    // Sort by _id to ensure consistent order for comparison
    return serialized.sort((a: any, b: any) => a._id.localeCompare(b._id));
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tableName = searchParams.get('tableName');

  if (!tableName) {
    return NextResponse.json({ error: 'Table name is required.' }, { status: 400 });
  }

  try {
    // Initialize both clients
    const mongoClient = await getClient(MONGO_URI);
    const mongoDb = mongoClient.db(DB_NAME);
    const adminApp = getFirebaseAdminApp();
    const firestore = getFirestore(adminApp);

    // --- MONGO ---
    const mongoCollection = mongoDb.collection(tableName);
    const mongoDocs = await mongoCollection.find({}).toArray();
    const mongoCount = mongoDocs.length; // Use length of fetched array for consistency

    // --- FIRESTORE ---
    const firestoreCollection = firestore.collection(tableName);
    const firestoreSnapshot = await firestoreCollection.get();
    const firestoreDocs = firestoreSnapshot.docs.map(doc => doc.data());
    const firestoreCount = firestoreSnapshot.size;

    // --- COMPARISON ---
    const countsMatch = mongoCount === firestoreCount;
    let allRecordsMatch = false;
    let mismatchedIds: string[] = [];

    if (countsMatch && mongoCount > 0) {
      const comparableMongo = getComparable(mongoDocs);
      const comparableFirestore = getComparable(firestoreDocs);

      // Deep compare the sorted arrays
      const mongoStr = JSON.stringify(comparableMongo);
      const firestoreStr = JSON.stringify(comparableFirestore);
      
      allRecordsMatch = mongoStr === firestoreStr;

      if (!allRecordsMatch) {
          // Find which IDs have mismatches if the strings don't match
          for(let i=0; i<comparableMongo.length; i++) {
              if (JSON.stringify(comparableMongo[i]) !== JSON.stringify(comparableFirestore[i])) {
                  mismatchedIds.push(comparableMongo[i]._id);
              }
          }
      }
    } else if (mongoCount === 0 && firestoreCount === 0) {
        allRecordsMatch = true;
    }

    return NextResponse.json({
      mongoCount,
      firestoreCount,
      countsMatch,
      allRecordsMatch,
      mismatchedIds,
    });

  } catch (error: any) {
    console.error(`Verification failed for ${tableName}:`, error);
    return NextResponse.json({ error: `Verification failed: ${error.message}` }, { status: 500 });
  }
}
