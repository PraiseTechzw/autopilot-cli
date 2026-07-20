import fs from 'fs/promises';
import path from 'path';
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

const LOCAL_LEADERBOARD_PATH = path.join(process.cwd(), 'data', 'leaderboard.json');

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

function normalizeRows(rows: Array<{
  id: string;
  username: string;
  score: number;
  commits: number;
  focus_minutes?: number;
  focusMinutes?: number;
  streak: number;
  last_active?: string;
  lastActive?: string;
}>) {
  return rows
    .map((u) => ({
      id: u.id,
      username: u.username,
      score: Number(u.score) || 0,
      commits: Number(u.commits) || 0,
      focusMinutes: Number(u.focus_minutes ?? u.focusMinutes) || 0,
      streak: Number(u.streak) || 0,
      lastActive: u.last_active ?? u.lastActive ?? new Date().toISOString(),
    }))
    .sort((a, b) => b.score - a.score);
}

async function readLocalLeaderboard(): Promise<UserStats[]> {
  try {
    const raw = await fs.readFile(LOCAL_LEADERBOARD_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return normalizeRows(parsed);
  } catch {
    return [];
  }
}

async function writeLocalLeaderboard(rows: UserStats[]): Promise<void> {
  const payload = JSON.stringify(rows, null, 2);
  await fs.mkdir(path.dirname(LOCAL_LEADERBOARD_PATH), { recursive: true });
  await fs.writeFile(LOCAL_LEADERBOARD_PATH, payload, 'utf8');
}

export async function getLeaderboard(): Promise<UserStats[]> {
  const supabase = getServerClient();
  if (!supabase) {
    const localRows = await readLocalLeaderboard();
    return localRows.length > 0 ? localRows : normalizeRows([]);
  }

  const { data, error } = await supabase
    .from('leaderboard')
    .select('id, username, score, commits, focus_minutes, streak, last_active')
    .order('score', { ascending: false })
    .limit(100);
  if (error || !data) return [];
  return normalizeRows(data as Array<{
    id: string;
    username: string;
    score: number;
    commits: number;
    focus_minutes: number;
    streak: number;
    last_active: string;
  }>);
}

export async function updateUserStats(stats: UserStats): Promise<UserStats[]> {
  const supabase = getServerClient();
  if (!supabase) {
    const current = await readLocalLeaderboard();
    const next = [
      ...current.filter((u) => u.id !== stats.id),
      stats,
    ].sort((a, b) => b.score - a.score);
    await writeLocalLeaderboard(next);
    return next;
  }

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
  if (error) throw new Error(describeError(error));
  return await getLeaderboard();
}
