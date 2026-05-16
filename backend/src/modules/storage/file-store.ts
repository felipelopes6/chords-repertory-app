import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

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

const defaultData: AppData = {
  users: [],
  sessions: [],
  repertories: [],
};

export class FileStore {
  private readonly filePath: string;

  constructor(filePath?: string) {
    // Use /tmp on Vercel serverless, data/ locally
    if (!filePath) {
      const isProduction = process.env.NODE_ENV === 'production';
      const isVercel = process.env.VERCEL === '1';

      if (isProduction && isVercel) {
        filePath = '/tmp/app-data.json';
      } else {
        filePath = path.resolve(process.cwd(), 'data/app-data.json');
      }
    }

    this.filePath = filePath;
  }

  async read() {
    try {
      const content = await readFile(this.filePath, 'utf8');
      return JSON.parse(content) as AppData;
    } catch (error) {
      if (isNodeError(error) && error.code === 'ENOENT') {
        return structuredClone(defaultData);
      }

      throw error;
    }
  }

  async write(data: AppData) {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, `${JSON.stringify(data, null, 2)}\n`);
  }
}

export const fileStore = new FileStore();

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

export type { AppData, StoredSession, StoredUser };
