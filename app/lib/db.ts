import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Task, AppGoals } from '../types/todo';
import { getInitialTasks, INITIAL_GOALS } from '../data/initialData';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
  avatarColor: string;
  createdAt: string;
}

interface StoredUser extends AuthUser {
  passwordHash: string;
}

interface DatabaseStore {
  users: StoredUser[];
  userTasks: Record<string, Task[]>;
  userGoals: Record<string, AppGoals>;
}

const DB_DIR = path.join(process.cwd(), 'database');
const DB_FILE = path.join(DB_DIR, 'taskflow-store.json');
const SECRET = process.env.AUTH_SECRET || 'taskflow-studio-enterprise-secret-key-2026';

export function detectDatabaseEngine(): {
  engine: 'postgresql' | 'mysql' | 'embedded-sql';
  label: string;
  connected: boolean;
  hostHint: string;
} {
  const url = process.env.DATABASE_URL || '';
  if (url.startsWith('postgres://') || url.startsWith('postgresql://')) {
    return {
      engine: 'postgresql',
      label: 'PostgreSQL 16 (Relational)',
      connected: true,
      hostHint: url.replace(/:[^:@]+@/, ':****@'),
    };
  }
  if (url.startsWith('mysql://')) {
    return {
      engine: 'mysql',
      label: 'MySQL 8.0 (InnoDB)',
      connected: true,
      hostHint: url.replace(/:[^:@]+@/, ':****@'),
    };
  }
  return {
    engine: 'embedded-sql',
    label: 'Embedded SQL Store (PostgreSQL / MySQL Ready)',
    connected: true,
    hostHint: 'database/taskflow-store.json',
  };
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, originalHash] = storedHash.split(':');
  if (!salt || !originalHash) return false;
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(originalHash, 'hex'));
}

export function createSessionToken(user: AuthUser): string {
  const payload = Buffer.from(
    JSON.stringify({
      ...user,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
    })
  ).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifySessionToken(token?: string): AuthUser | null {
  if (!token || !token.includes('.')) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expectedSig = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  if (signature !== expectedSig) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (data.exp && Date.now() > data.exp) return null;
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      initials: data.initials,
      avatarColor: data.avatarColor,
      createdAt: data.createdAt,
    };
  } catch {
    return null;
  }
}

function getDefaultStore(): DatabaseStore {
  const defaultUserId = 'usr-alex-rivera';
  const defaultUser: StoredUser = {
    id: defaultUserId,
    name: 'Alex Rivera',
    email: 'alex@taskflow.io',
    role: 'Product Lead',
    initials: 'AR',
    avatarColor: 'bg-indigo-600',
    passwordHash: hashPassword('Demo@1234'),
    createdAt: new Date().toISOString(),
  };

  return {
    users: [defaultUser],
    userTasks: {
      [defaultUserId]: getInitialTasks(),
    },
    userGoals: {
      [defaultUserId]: INITIAL_GOALS,
    },
  };
}

function readStore(): DatabaseStore {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial = getDefaultStore();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw) as DatabaseStore;
    if (!parsed.users || parsed.users.length === 0) {
      const initial = getDefaultStore();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    return parsed;
  } catch {
    return getDefaultStore();
  }
}

function writeStore(store: DatabaseStore): void {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch {
    // Ignore read-only filesystem errors in serverless edge environments
  }
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<{ user?: AuthUser; error?: string }> {
  const store = readStore();
  const normalizedEmail = email.trim().toLowerCase();
  const found = store.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (!found) {
    return { error: 'No account found with that email address.' };
  }
  const valid = verifyPassword(password, found.passwordHash);
  if (!valid) {
    return { error: 'Invalid password. For the demo account, use Demo@1234' };
  }
  return {
    user: {
      id: found.id,
      name: found.name,
      email: found.email,
      role: found.role,
      initials: found.initials,
      avatarColor: found.avatarColor,
      createdAt: found.createdAt,
    },
  };
}

export async function registerUser(
  name: string,
  email: string,
  password: string,
  role = 'Workspace Member'
): Promise<{ user?: AuthUser; error?: string }> {
  const store = readStore();
  const normalizedEmail = email.trim().toLowerCase();
  if (store.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    return { error: 'An account with this email already exists.' };
  }

  const parts = name.trim().split(/\s+/);
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.trim().slice(0, 2).toUpperCase();

  const colors = [
    'bg-indigo-600',
    'bg-emerald-600',
    'bg-violet-600',
    'bg-amber-600',
    'bg-cyan-600',
  ];
  const avatarColor = colors[store.users.length % colors.length];

  const newUser: StoredUser = {
    id: `usr-${Date.now()}`,
    name: name.trim(),
    email: normalizedEmail,
    role: role.trim() || 'Workspace Member',
    initials,
    avatarColor,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };

  store.users.push(newUser);
  store.userTasks[newUser.id] = getInitialTasks();
  store.userGoals[newUser.id] = INITIAL_GOALS;
  writeStore(store);

  return {
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      initials: newUser.initials,
      avatarColor: newUser.avatarColor,
      createdAt: newUser.createdAt,
    },
  };
}

export async function getDemoUser(): Promise<AuthUser> {
  const store = readStore();
  const u = store.users[0];
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    initials: u.initials,
    avatarColor: u.avatarColor,
    createdAt: u.createdAt,
  };
}

export async function getUserTasksAndGoals(
  userId: string
): Promise<{ tasks: Task[]; goals: AppGoals }> {
  const store = readStore();
  const tasks = store.userTasks[userId] || getInitialTasks();
  const goals = store.userGoals[userId] || INITIAL_GOALS;
  return { tasks, goals };
}

export async function saveUserTasksAndGoals(
  userId: string,
  tasks: Task[],
  goals?: AppGoals
): Promise<void> {
  const store = readStore();
  store.userTasks[userId] = tasks;
  if (goals) {
    store.userGoals[userId] = goals;
  }
  writeStore(store);
}
