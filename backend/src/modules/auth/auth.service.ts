import { randomUUID } from 'node:crypto';

import { ResourceNotFoundError } from '../../domain/errors.js';
import { fileStore } from '../storage/file-store.js';
import { hashPassword, verifyPassword } from './password.js';

export class AuthError extends Error {
  readonly statusCode = 401;

  constructor(message = 'Credenciais inválidas.') {
    super(message);
    this.name = 'AuthError';
  }
}

export class ConflictError extends Error {
  readonly statusCode = 409;

  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

type Credentials = {
  username: string;
  password: string;
};

export async function registerUser({ username, password }: Credentials) {
  const data = await fileStore.read();
  const normalizedUsername = normalizeUsername(username);

  if (data.users.some((user) => user.username === normalizedUsername)) {
    throw new ConflictError('Nome de usuário já cadastrado.');
  }

  const user = {
    id: randomUUID(),
    username: normalizedUsername,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  const token = randomUUID();

  data.users.push(user);
  data.sessions.push({
    token,
    userId: user.id,
    createdAt: new Date().toISOString(),
  });

  await fileStore.write(data);

  return {
    token,
    user: toPublicUser(user),
  };
}

export async function loginUser({ username, password }: Credentials) {
  const data = await fileStore.read();
  const normalizedUsername = normalizeUsername(username);
  const user = data.users.find((candidate) => candidate.username === normalizedUsername);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new AuthError();
  }

  const token = randomUUID();

  data.sessions.push({
    token,
    userId: user.id,
    createdAt: new Date().toISOString(),
  });

  await fileStore.write(data);

  return {
    token,
    user: toPublicUser(user),
  };
}

export async function getUserByToken(token: string | null) {
  if (!token) {
    throw new AuthError('Token de autenticação ausente.');
  }

  const data = await fileStore.read();
  const session = data.sessions.find((candidate) => candidate.token === token);

  if (!session) {
    throw new AuthError('Token de autenticação inválido.');
  }

  const user = data.users.find((candidate) => candidate.id === session.userId);

  if (!user) {
    throw new ResourceNotFoundError('Usuário não encontrado.');
  }

  return toPublicUser(user);
}

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

function toPublicUser(user: { id: string; username: string; createdAt: string }) {
  return {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt,
  };
}
