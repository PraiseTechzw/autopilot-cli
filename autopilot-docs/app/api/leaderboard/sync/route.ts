import { NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase';
import { UserStats } from '@/lib/leaderboard';

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

    const supabase = getServerClient();
    const { error: upsertError } = await supabase
      .from('leaderboard')
      .upsert(stats, { onConflict: 'id' });
    if (upsertError) {
      return NextResponse.json({ error: 'Failed to sync leaderboard' }, { status: 500 });
    }

    const { data: all, error: fetchError } = await supabase
      .from('leaderboard')
      .select('id,score')
      .order('score', { ascending: false })
      .limit(100);
    if (fetchError || !all) {
      return NextResponse.json({ success: true });
    }
    const rank = (all.findIndex(u => u.id === stats.id) + 1) || null;
    return NextResponse.json({ success: true, rank });
  } catch (error) {
    console.error('Failed to sync leaderboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
