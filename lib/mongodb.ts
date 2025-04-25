import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;


let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!process.env.MONGODB_URI) {
    throw new Error('Please add your MongoDB URI to .env.local');
}

if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable to preserve the MongoDB connection
    if (!(global as any)._mongoClientPromise) {
        client = new MongoClient(uri!);
        (global as any)._mongoClientPromise = client.connect();
    }
    clientPromise = (global as any)._mongoClientPromise;
} else {
    // In production mode, create a new connection
    client = new MongoClient(uri!);
    clientPromise = client.connect();
}

export default clientPromise;