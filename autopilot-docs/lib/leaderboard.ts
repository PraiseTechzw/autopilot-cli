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
    .select('*')
    .order('score', { ascending: false })
    .limit(100);
  if (error || !data) return [];
  return data as UserStats[];
}

export async function updateUserStats(stats: UserStats): Promise<UserStats[]> {
  const supabase = getServerClient();
  const { error } = await supabase
    .from('leaderboard')
    .upsert(stats, { onConflict: 'id' });
  if (error) throw error;
  return await getLeaderboard();
}
