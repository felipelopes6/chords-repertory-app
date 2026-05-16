import { MongoClient } from 'mongodb';

import { env } from './env.js';

let client: MongoClient | null = null;

export async function getMongoClient() {
  if (!env.MONGODB_URL) {
    throw new Error('MONGODB_URL environment variable is not set');
  }

  if (!client) {
    client = new MongoClient(env.MONGODB_URL);
    await client.connect();
  }

  return client;
}

export async function getDatabase() {
  const client = await getMongoClient();
  return client.db('repertory-app');
}

export async function closeDatabase() {
  if (client) {
    await client.close();
    client = null;
  }
}
