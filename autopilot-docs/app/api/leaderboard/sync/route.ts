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

    const updatedLeaderboard = await updateUserStats(stats);
    return NextResponse.json({ success: true, rank: updatedLeaderboard.findIndex(u => u.id === stats.id) + 1 });
  } catch (error) {
    console.error('Failed to sync leaderboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
