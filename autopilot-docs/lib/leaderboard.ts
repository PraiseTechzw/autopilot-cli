import { getServerClient } from './supabase';

export interface UserStats {
  id: string;
  username: string;
  score: number;
  commits: number;
  focusMinutes: number;
  streak: number;
  lastActive: string;
}

export async function getLeaderboard(): Promise<UserStats[]> {
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from('leaderboard')
    .select('id, username, score, commits, focus_minutes, streak, last_active')
    .order('score', { ascending: false })
    .limit(100);
  if (error || !data) return [];
  // Normalize to camelCase for the frontend
  const rows = data as Array<{
    id: string;
    username: string;
    score: number;
    commits: number;
    focus_minutes: number;
    streak: number;
    last_active: string;
  }>;
  return rows.map((u) => ({
    id: u.id,
    username: u.username,
    score: Number(u.score) || 0,
    commits: Number(u.commits) || 0,
    focusMinutes: Number(u.focus_minutes) || 0,
    streak: Number(u.streak) || 0,
    lastActive: u.last_active,
  }));
}

export async function updateUserStats(stats: UserStats): Promise<UserStats[]> {
  const supabase = getServerClient();
  // Convert to snake_case for storage
  const row = {
    id: stats.id,
    username: stats.username,
    score: stats.score,
    commits: stats.commits,
    focus_minutes: stats.focusMinutes,
    streak: stats.streak,
    last_active: stats.lastActive,
  };
  const { error } = await supabase
    .from('leaderboard')
    .upsert(row, { onConflict: 'id' });
  if (error) throw error;
  return await getLeaderboard();
}
