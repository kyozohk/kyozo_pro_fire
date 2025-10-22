import { getClient } from '@/lib/mongodb';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';

const MONGO_URI = "mongodb+srv://1234dev28:4testconnect@prod-kyozo-db.8rs1g.mongodb.net/?retryWrites=true&w=majority&appName=prod-kyozo-db";
const DB_NAME = "Prod-Kyozo";
const COLLECTIONS_TO_CHECK = [
    "broadcasts",
    "categories",
    "channels",
    "communities",
    "importhistories",
    "linktrackers",
    "messages",
    "otphistories",
    "participations",
    "paymenthistories",
    "payments",
    "paymenttransactions",
    "phonecodes",
    "registertrackers",
    "sendwamessagehistories",
    "stripewebhooks",
    "thirdpartyproviders",
    "threesixtywebhookhistories",
    "tokens",
    "users",
    "webhookevents",
    "webhooks"
];


export async function GET() {
  try {
    const mongoClient = await getClient(MONGO_URI);
    const mongoDb = mongoClient.db(DB_NAME);

    const adminApp = getFirebaseAdminApp();
    const firestore = getFirestore(adminApp);

    const statuses = await Promise.all(COLLECTIONS_TO_CHECK.map(async (name) => {
      // Get count from MongoDB
      const mongoCollection = mongoDb.collection(name);
      const mongoCount = await mongoCollection.countDocuments();
      
      // Check if collection exists and has documents in Firestore
      let isExported = false;
      try {
        const firestoreCollection = firestore.collection(name);
        const firestoreSnapshot = await firestoreCollection.limit(1).get();
        isExported = !firestoreSnapshot.empty;
      } catch (e) {
        // If there's an error checking firestore (e.g. credentials), assume not exported
        console.warn(`Could not check Firestore status for ${name}, assuming not exported.`);
      }
      
      return {
        name,
        documentCount: mongoCount,
        isExported,
      };
    }));

    return NextResponse.json(statuses);

  } catch (error: any) {
    console.error("Failed to fetch table statuses:", error);
    // If we fail, return the hardcoded list with counts from Mongo if possible, or 0.
    if (error.message.includes('FIREBASE')) {
        console.warn("Firebase connection failed. Returning table list without export status.");
        const mongoClient = await getClient(MONGO_URI);
        const mongoDb = mongoClient.db(DB_NAME);
        const statuses = await Promise.all(COLLECTIONS_TO_CHECK.map(async (name) => {
            const mongoCollection = mongoDb.collection(name);
            const mongoCount = await mongoCollection.countDocuments();
            return {
                name,
                documentCount: mongoCount,
                isExported: false, // Default to false since we can't check
            };
        }));
        return NextResponse.json(statuses);
    }

    return NextResponse.json({ error: `Failed to fetch statuses: ${error.message}` }, { status: 500 });
  }
}
