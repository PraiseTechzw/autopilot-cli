import { NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/leaderboard';

export async function GET() {
  const data = await getLeaderboard();
  return NextResponse.json(data);
}
