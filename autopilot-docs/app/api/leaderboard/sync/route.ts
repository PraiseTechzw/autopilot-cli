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
    const row = {
      id: stats.id,
      username: stats.username,
      score: stats.score,
      commits: stats.commits,
      focus_minutes: stats.focusMinutes,
      streak: stats.streak,
      last_active: stats.lastActive,
    };
    const { error: upsertError } = await supabase
      .from('leaderboard')
      .upsert(row, { onConflict: 'id' });

    if (upsertError) {
      console.error('Supabase upsert error:', upsertError);
      return NextResponse.json({
        error: 'Failed to sync leaderboard',
        details: upsertError.message,
        hint: 'Check if RLS policies allow upsert or if SUPABASE_SERVICE_ROLE_KEY is missing.'
      }, { status: 500 });
    }

    const { data: all, error: fetchError } = await supabase
      .from('leaderboard')
      .select('id,score')
      .order('score', { ascending: false })
      .limit(100);

    if (fetchError || !all) {
      console.warn('Leaderboard fetch error or empty:', fetchError);
      return NextResponse.json({ success: true, rank: null });
    }

    const rank = (all.findIndex(u => u.id === stats.id) + 1) || null;
    return NextResponse.json({ success: true, rank });
  } catch (error) {
    console.error('Failed to sync leaderboard (Catch):', error);
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
