import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  verifySessionToken,
  getDemoUser,
  getUserTasksAndGoals,
  saveUserTasksAndGoals,
  detectDatabaseEngine,
} from '../../lib/db';

const COOKIE_NAME = 'taskflow_session';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  let user = verifySessionToken(token);
  if (!user) {
    user = await getDemoUser();
  }

  const { tasks, goals } = await getUserTasksAndGoals(user.id);
  const dbInfo = detectDatabaseEngine();

  return NextResponse.json({
    user,
    tasks,
    goals,
    db: dbInfo,
  });
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    let user = verifySessionToken(token);
    if (!user) {
      user = await getDemoUser();
    }

    const body = await request.json();
    const { tasks, goals } = body;

    if (Array.isArray(tasks)) {
      await saveUserTasksAndGoals(user.id, tasks, goals);
    }

    return NextResponse.json({
      ok: true,
      syncedAt: new Date().toLocaleTimeString(),
      db: detectDatabaseEngine(),
    });
  } catch {
    return NextResponse.json({ error: 'Failed to sync tasks to database.' }, { status: 500 });
  }
}

