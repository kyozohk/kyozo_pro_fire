import { getClient } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

const MONGO_URI = "mongodb+srv://1234dev28:4testconnect@prod-kyozo-db.8rs1g.mongodb.net/?retryWrites=true&w=majority&appName=prod-kyozo-db";
const DB_NAME = "Prod-Kyozo";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tableName = searchParams.get('tableName');

  if (!tableName) {
    return NextResponse.json({ error: 'Table name is required.' }, { status: 400 });
  }

  try {
    const mongoClient = await getClient(MONGO_URI);
    const mongoDb = mongoClient.db(DB_NAME);
    const collection = mongoDb.collection(tableName);
    const count = await collection.countDocuments();
    
    return NextResponse.json({ count });
  } catch (error: any) {
    return NextResponse.json({ error: `Failed to count documents in ${tableName}: ${error.message}` }, { status: 500 });
  }
}
