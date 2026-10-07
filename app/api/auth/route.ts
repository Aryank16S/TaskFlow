import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  authenticateUser,
  registerUser,
  getDemoUser,
  createSessionToken,
  verifySessionToken,
  detectDatabaseEngine,
} from '../../lib/db';

const COOKIE_NAME = 'taskflow_session';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const sessionUser = verifySessionToken(token);
  const dbInfo = detectDatabaseEngine();

  if (!sessionUser) {
    return NextResponse.json({
      authenticated: false,
      user: null,
      db: dbInfo,
    });
  }

  return NextResponse.json({
    authenticated: true,
    user: sessionUser,
    db: dbInfo,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, name, email, password, role } = body;
    const cookieStore = await cookies();
    const dbInfo = detectDatabaseEngine();

    if (action === 'logout') {
      cookieStore.delete(COOKIE_NAME);
      return NextResponse.json({
        authenticated: false,
        user: null,
        db: dbInfo,
      });
    }

    if (action === 'demo') {
      const demoUser = await getDemoUser();
      const token = createSessionToken(demoUser);
      cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });
      return NextResponse.json({
        authenticated: true,
        user: demoUser,
        db: dbInfo,
      });
    }

    if (action === 'register') {
      if (!name || !email || !password) {
        return NextResponse.json(
          { error: 'Name, email, and password are required.' },
          { status: 400 }
        );
      }
      const { user, error } = await registerUser(name, email, password, role);
      if (error || !user) {
        return NextResponse.json({ error: error || 'Registration failed.' }, { status: 400 });
      }
      const token = createSessionToken(user);
      cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });
      return NextResponse.json({
        authenticated: true,
        user,
        db: dbInfo,
      });
    }

    if (action === 'login') {
      if (!email || !password) {
        return NextResponse.json(
          { error: 'Email and password are required.' },
          { status: 400 }
        );
      }
      const { user, error } = await authenticateUser(email, password);
      if (error || !user) {
        return NextResponse.json({ error: error || 'Invalid credentials.' }, { status: 401 });
      }
      const token = createSessionToken(user);
      cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });
      return NextResponse.json({
        authenticated: true,
        user,
        db: dbInfo,
      });
    }

    return NextResponse.json({ error: 'Invalid auth action.' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Authentication server error.' }, { status: 500 });
  }
}

