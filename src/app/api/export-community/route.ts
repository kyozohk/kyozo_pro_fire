
import { getClient } from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

const MONGO_URI = "mongodb+srv://1234dev28:4testconnect@prod-kyozo-db.8rs1g.mongodb.net/?retryWrites=true&w=majority&appName=prod-kyozo-db";
const DB_NAME = "Prod-Kyozo";
const COMMUNITY_COLLECTION_NAME = "communities";
const MESSAGES_COLLECTION_NAME = "messages";
const USERS_COLLECTION_NAME = "users";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const communityName = searchParams.get('communityName');

  if (!communityName) {
    return NextResponse.json({ error: 'Community name is required.' }, { status: 400 });
  }

  try {
    const mongoClient = await getClient(MONGO_URI);
    const mongoDb = mongoClient.db(DB_NAME);

    // 1. Find the community
    const community = await mongoDb.collection(COMMUNITY_COLLECTION_NAME).findOne({ name: communityName });
    if (!community) {
      return NextResponse.json({ error: `Community "${communityName}" not found in MongoDB.` }, { status: 404 });
    }

    // Prepare community data for export (convert ObjectId to string)
    const communityData = {
      ...community,
      mongoId: community._id.toString(),
    };
    delete communityData._id;

    // 2. Find all messages for this community
    const messages = await mongoDb.collection(MESSAGES_COLLECTION_NAME).find({ communityName: communityName }).toArray();
    
    // 3. Get unique sender IDs from messages
    const senderIds = Array.from(new Set(messages.map(m => m.sender).filter(Boolean)));

    // 4. Fetch full user details for each sender
    const usersCollection = mongoDb.collection(USERS_COLLECTION_NAME);
    // Assuming sender IDs in messages collection can be used to find users by their '_id'
    const memberDetails = await usersCollection.find({ _id: { $in: senderIds.map(id => new ObjectId(id)) } }).toArray();

    // 5. Structure the member data with their messages
    const membersWithMessages = memberDetails.map(memberDoc => {
      const memberId = memberDoc._id.toString();
      // Filter messages for the current member
      const memberMessages = messages
        .filter(msg => msg.sender === memberId)
        .map(msg => ({ // Sanitize each message for export
            ...msg,
            _id: msg._id.toString(),
            mongoId: msg._id.toString()
        }));

      return {
        ...memberDoc,
        _id: memberId, // ensure _id is a string
        mongoId: memberId,
        messages: memberMessages,
      };
    });

    return NextResponse.json({ communityData, members: membersWithMessages });

  } catch (error: any) {
    console.error("Failed to fetch community data for export:", error);
    return NextResponse.json({ error: `Failed to fetch data for export: ${error.message}` }, { status: 500 });
  }
}
