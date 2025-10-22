

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
  const userId = searchParams.get('userId');

  if (!communityName) {
    return NextResponse.json({ error: 'Community name is required.' }, { status: 400 });
  }

  try {
    const mongoClient = await getClient(MONGO_URI);
    const mongoDb = mongoClient.db(DB_NAME);

    // If userId is provided, we only need to fetch messages for that user in that community.
    if (userId) {
      // The `sender` field in the messages collection is a string, not an ObjectId.
      // Therefore, we query using the string userId directly.
      const messages = await mongoDb.collection(MESSAGES_COLLECTION_NAME).find({
        communityName: communityName,
        sender: userId
      }).project({ _id: 1, text: 1, createdAt: 1 }).sort({ createdAt: -1 }).toArray();

      const serializableMessages = messages.map(m => ({
          ...m,
          _id: m._id.toString()
      }));

      return NextResponse.json({ messages: serializableMessages });
    }

    // If only communityName is provided, fetch the members.
    const community = await mongoDb.collection(COMMUNITY_COLLECTION_NAME).findOne({ name: communityName }, { projection: { usersList: 1 } });
    if (!community) {
      return NextResponse.json({ error: `Community "${communityName}" not found.` }, { status: 404 });
    }

    const userIds = (community.usersList || [])
      .map((u: { userId: string }) => u.userId)
      .filter((id: string) => id && ObjectId.isValid(id))
      .map((id: string) => new ObjectId(id));
      
    if (userIds.length === 0) {
        return NextResponse.json({ members: [] });
    }

    const members = await mongoDb.collection(USERS_COLLECTION_NAME).find({
      _id: { $in: userIds }
    }).project({ _id: 1, fullName: 1 }).toArray();

    const serializableMembers = members.map(m => ({
        ...m,
        _id: m._id.toString()
    }));

    return NextResponse.json({ members: serializableMembers });

  } catch (error: any) {
    console.error("Failed to fetch tree data:", error);
    return NextResponse.json({ error: `Failed to fetch data: ${error.message}` }, { status: 500 });
  }
}
