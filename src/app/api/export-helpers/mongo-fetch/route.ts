import { getClient } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

const MONGO_URI = "mongodb+srv://1234dev28:4testconnect@prod-kyozo-db.8rs1g.mongodb.net/?retryWrites=true&w=majority&appName=prod-kyozo-db";
const DB_NAME = "Prod-Kyozo";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tableName = searchParams.get('tableName');
  const page = parseInt(searchParams.get('page') || '0', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '400', 10);

  if (!tableName) {
    return NextResponse.json({ error: 'Table name is required.' }, { status: 400 });
  }

  try {
    const mongoClient = await getClient(MONGO_URI);
    const mongoDb = mongoClient.db(DB_NAME);
    const collection = mongoDb.collection(tableName);
    const documents = await collection.find({}).skip(page * pageSize).limit(pageSize).toArray();

    // Serialize documents to ensure BSON types like ObjectId are converted to strings.
    const serializableDocs = JSON.parse(JSON.stringify(documents));

    return NextResponse.json(serializableDocs);
  } catch (error: any) {
    return NextResponse.json({ error: `Failed to fetch documents from ${tableName}: ${error.message}` }, { status: 500 });
  }
}
