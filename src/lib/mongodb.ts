import { MongoClient } from 'mongodb'

const options = {
    // These options are recommended by MongoDB for modern applications
    maxPoolSize: 50,
    wtimeoutMS: 2500,
    connectTimeoutMS: 30000,
    serverSelectionTimeoutMS: 30000,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

const MONGO_URI = "mongodb+srv://1234dev28:4testconnect@prod-kyozo-db.8rs1g.mongodb.net/?retryWrites=true&w=majority&appName=prod-kyozo-db";


if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    const globalWithMongo = global as typeof global & {
        _mongoClientPromise?: Promise<MongoClient>
    }

    if (!globalWithMongo._mongoClientPromise) {
        client = new MongoClient(MONGO_URI, options);
        globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
} else {
    // In production mode, it's best to not use a global variable.
    client = new MongoClient(MONGO_URI, options);
    clientPromise = client.connect();
}

export async function getClient(uri: string): Promise<MongoClient> {
    if (!uri) {
        throw new Error('MongoDB URI is missing.');
    }
    // In this setup, we are ignoring the passed URI and using the one defined in this file.
    // This simplifies connection management for a single database.
    return clientPromise;
}
