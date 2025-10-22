import { getClient } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

const MONGO_URI = "mongodb+srv://1234dev28:4testconnect@prod-kyozo-db.8rs1g.mongodb.net/?retryWrites=true&w=majority&appName=prod-kyozo-db";
const DB_NAME = "Prod-Kyozo";
const COLLECTION_NAME = "communities";

export async function GET() {
  try {
    const client = await getClient(MONGO_URI);
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    const communities = await collection.find({}, { projection: { name: 1, _id: 1 } }).sort({ name: 1 }).toArray();
    
    const uniqueCommunities = Array.from(new Map(communities.map(c => [c.name, c])).values())
                                 .filter(c => c.name) // Filter out any null/undefined names
                                 .map(c => ({ name: c.name, _id: c._id.toString() }));

    return NextResponse.json(uniqueCommunities);
  } catch (e: any) {
    return NextResponse.json({ error: `Failed to fetch communities: ${e.message}` }, { status: 500 });
  }
}
