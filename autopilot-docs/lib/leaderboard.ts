import fs from 'fs/promises';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'leaderboard.json');

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
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    const users: UserStats[] = JSON.parse(data);
    return users.sort((a, b) => b.score - a.score);
  } catch (error) {
    // If file doesn't exist or is invalid, return empty array
    return [];
  }
}

export async function updateUserStats(stats: UserStats): Promise<UserStats[]> {
  let users = await getLeaderboard();
  const index = users.findIndex(u => u.id === stats.id);
  
  if (index >= 0) {
    users[index] = { ...users[index], ...stats };
  } else {
    users.push(stats);
  }
  
  // Sort and limit to top 100 to keep file size manageable
  users.sort((a, b) => b.score - a.score);
  users = users.slice(0, 100);

  await fs.writeFile(DB_PATH, JSON.stringify(users, null, 2));
  return users;
}
