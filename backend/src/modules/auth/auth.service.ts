import { randomUUID } from 'node:crypto';

import { ResourceNotFoundError } from '../../domain/errors.js';
import { mongoStore } from '../storage/mongo-store.js';
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
  const normalizedUsername = normalizeUsername(username);
  const existingUser = await mongoStore.findUserByUsername(normalizedUsername);

  if (existingUser) {
    throw new ConflictError('Nome de usuário já cadastrado.');
  }

  const user = {
    id: randomUUID(),
    username: normalizedUsername,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  const token = randomUUID();

  await mongoStore.createUser(user);
  await mongoStore.createSession({
    token,
    userId: user.id,
    createdAt: new Date().toISOString(),
  });

  return {
    token,
    user: toPublicUser(user),
  };
}

export async function loginUser({ username, password }: Credentials) {
  const normalizedUsername = normalizeUsername(username);
  const user = await mongoStore.findUserByUsername(normalizedUsername);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new AuthError();
  }

  const token = randomUUID();

  await mongoStore.createSession({
    token,
    userId: user.id,
    createdAt: new Date().toISOString(),
  });

  return {
    token,
    user: toPublicUser(user),
  };
}

export async function getUserByToken(token: string | null) {
  if (!token) {
    throw new AuthError('Token de autenticação ausente.');
  }

  const session = await mongoStore.findSessionByToken(token);

  if (!session) {
    throw new AuthError('Token de autenticação inválido.');
  }

  const user = await mongoStore.findUserById(session.userId);

  if (!user) {
    throw new ResourceNotFoundError('Usuário não encontrado.');
  }

  return toPublicUser(user);
}

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

function toPublicUser(user: {
  id: string;
  username: string;
  createdAt: string;
}) {
  return {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt,
  };
}
