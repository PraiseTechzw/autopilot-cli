import { NextResponse } from 'next/server';
import { updateUserStats, UserStats } from '@/lib/leaderboard';

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const candidate = error as Record<string, unknown>;
    const parts: string[] = [];

    for (const key of ['message', 'details', 'hint', 'code', 'status'] as const) {
      const value = candidate[key];
      if (typeof value === 'string' && value.trim()) {
        parts.push(`${key}: ${value}`);
      }
    }

    if (parts.length > 0) {
      return parts.join(' | ');
    }

    try {
      return JSON.stringify(error);
    } catch {
      return '[unserializable error]';
    }
  }

  return String(error);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Basic validation
    if (!body.id || !body.username) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const stats: UserStats = {
      id: body.id,
      username: body.username,
      score: body.score || 0,
      commits: body.commits || 0,
      focusMinutes: body.focusMinutes || 0,
      streak: body.streak || 0,
      lastActive: new Date().toISOString()
    };
    const all = await updateUserStats(stats);
    const rank = (all.findIndex(u => u.id === stats.id) + 1) || null;
    return NextResponse.json({ success: true, rank });
  } catch (error) {
    console.error('Failed to sync leaderboard (Catch):', error);
    return NextResponse.json({ error: 'Internal server error', details: describeError(error) }, { status: 500 });
  }
}
