import type { Collection } from 'mongodb';

import { getDatabase } from '../../config/database.js';
import type { Repertory } from '../repertory/repertory.schema.js';

type StoredUser = {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
};

type StoredSession = {
  token: string;
  userId: string;
  createdAt: string;
};

type AppData = {
  users: StoredUser[];
  sessions: StoredSession[];
  repertories: Repertory[];
};

class MongoStore {
  private async getUsersCollection(): Promise<Collection<StoredUser>> {
    const db = await getDatabase();
    return db.collection<StoredUser>('users');
  }

  private async getSessionsCollection(): Promise<Collection<StoredSession>> {
    const db = await getDatabase();
    return db.collection<StoredSession>('sessions');
  }

  private async getRepertoriesCollection(): Promise<Collection<Repertory>> {
    const db = await getDatabase();
    return db.collection<Repertory>('repertories');
  }

  async read(): Promise<AppData> {
    const [users, sessions, repertories] = await Promise.all([
      (await this.getUsersCollection()).find().toArray(),
      (await this.getSessionsCollection()).find().toArray(),
      (await this.getRepertoriesCollection()).find().toArray(),
    ]);

    return {
      users,
      sessions,
      repertories,
    };
  }

  async write(data: AppData): Promise<void> {
    const usersCol = await this.getUsersCollection();
    const sessionsCol = await this.getSessionsCollection();
    const repertoriesCol = await this.getRepertoriesCollection();

    // Clear existing data and insert new data
    await Promise.all([
      usersCol.deleteMany({}),
      sessionsCol.deleteMany({}),
      repertoriesCol.deleteMany({}),
    ]);

    await Promise.all([
      data.users.length > 0
        ? usersCol.insertMany(data.users)
        : Promise.resolve(),
      data.sessions.length > 0
        ? sessionsCol.insertMany(data.sessions)
        : Promise.resolve(),
      data.repertories.length > 0
        ? repertoriesCol.insertMany(data.repertories)
        : Promise.resolve(),
    ]);
  }

  // Optimized methods for better performance
  async findUserByUsername(username: string): Promise<StoredUser | null> {
    const collection = await this.getUsersCollection();
    return collection.findOne({ username });
  }

  async findUserById(id: string): Promise<StoredUser | null> {
    const collection = await this.getUsersCollection();
    return collection.findOne({ id });
  }

  async createUser(user: StoredUser): Promise<void> {
    const collection = await this.getUsersCollection();
    await collection.insertOne(user);
  }

  async findSessionByToken(token: string): Promise<StoredSession | null> {
    const collection = await this.getSessionsCollection();
    return collection.findOne({ token });
  }

  async createSession(session: StoredSession): Promise<void> {
    const collection = await this.getSessionsCollection();
    await collection.insertOne(session);
  }

  async findRepertoriesByUserId(userId: string): Promise<Repertory[]> {
    const collection = await this.getRepertoriesCollection();
    return collection.find({ userId }).toArray();
  }

  async findRepertoryById(id: string): Promise<Repertory | null> {
    const collection = await this.getRepertoriesCollection();
    return collection.findOne({ id });
  }

  async createRepertory(repertory: Repertory): Promise<void> {
    const collection = await this.getRepertoriesCollection();
    await collection.insertOne(repertory);
  }

  async updateRepertory(id: string, repertory: Repertory): Promise<void> {
    const collection = await this.getRepertoriesCollection();
    await collection.replaceOne({ id }, repertory);
  }

  async deleteRepertory(id: string): Promise<void> {
    const collection = await this.getRepertoriesCollection();
    await collection.deleteOne({ id });
  }
}

export const mongoStore = new MongoStore();

export type { AppData, StoredSession, StoredUser };
