import { NextResponse } from 'next/server';
import { updateUserStats, UserStats } from '@/lib/leaderboard';

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
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
