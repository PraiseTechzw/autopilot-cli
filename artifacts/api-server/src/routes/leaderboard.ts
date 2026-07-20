import { Router } from "express";
import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";
// process.cwd() is artifacts/api-server/ when the server starts
const LOCAL_PATH = path.resolve(process.cwd(), "data/leaderboard.json");

const router = Router();

interface UserStats {
  id: string;
  username: string;
  score: number;
  commits: number;
  focusMinutes: number;
  streak: number;
  lastActive: string;
}

function normalizeRows(rows: any[]): UserStats[] {
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

async function getSupabaseClient() {
  const url = process.env["SUPABASE_URL"] || process.env["NEXT_PUBLIC_SUPABASE_URL"] || "";
  const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"] || "";
  if (!url || !serviceKey) return null;
  try {
    const { createClient } = await import("@supabase/supabase-js");
    return createClient(url, serviceKey);
  } catch {
    return null;
  }
}

async function readLocalLeaderboard(): Promise<UserStats[]> {
  try {
    if (!existsSync(LOCAL_PATH)) return [];
    const raw = await fs.readFile(LOCAL_PATH, "utf8");
    return normalizeRows(JSON.parse(raw));
  } catch {
    return [];
  }
}

async function writeLocalLeaderboard(data: UserStats[]): Promise<void> {
  const dir = path.dirname(LOCAL_PATH);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(LOCAL_PATH, JSON.stringify(data, null, 2));
}

async function getLeaderboard(): Promise<UserStats[]> {
  const supabase = await getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("leaderboard")
      .select("*")
      .order("score", { ascending: false })
      .limit(100);
    if (!error && data) return normalizeRows(data);
  }
  return readLocalLeaderboard();
}

async function updateUserStats(stats: UserStats): Promise<UserStats[]> {
  const supabase = await getSupabaseClient();
  if (supabase) {
    await supabase.from("leaderboard").upsert({
      id: stats.id,
      username: stats.username,
      score: stats.score,
      commits: stats.commits,
      focus_minutes: stats.focusMinutes,
      streak: stats.streak,
      last_active: stats.lastActive,
    });
    return getLeaderboard();
  }
  // Local fallback
  const all = await readLocalLeaderboard();
  const idx = all.findIndex((u) => u.id === stats.id);
  if (idx >= 0) all[idx] = stats;
  else all.push(stats);
  const sorted = all.sort((a, b) => b.score - a.score);
  await writeLocalLeaderboard(sorted);
  return sorted;
}

// GET /api/leaderboard
router.get("/leaderboard", async (_req, res) => {
  try {
    const data = await getLeaderboard();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

// POST /api/leaderboard (sync user stats)
router.post("/leaderboard", async (req, res) => {
  try {
    const body = req.body;
    if (!body.id || !body.username) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    const stats: UserStats = {
      id: body.id,
      username: body.username,
      score: body.score || 0,
      commits: body.commits || 0,
      focusMinutes: body.focusMinutes || 0,
      streak: body.streak || 0,
      lastActive: new Date().toISOString(),
    };
    const all = await updateUserStats(stats);
    const rank = (all.findIndex((u) => u.id === stats.id) + 1) || null;
    res.json({ success: true, rank });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/leaderboard/sync (alias)
router.post("/leaderboard/sync", async (req, res) => {
  try {
    const body = req.body;
    if (!body.id || !body.username) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    const stats: UserStats = {
      id: body.id,
      username: body.username,
      score: body.score || 0,
      commits: body.commits || 0,
      focusMinutes: body.focusMinutes || 0,
      streak: body.streak || 0,
      lastActive: new Date().toISOString(),
    };
    const all = await updateUserStats(stats);
    const rank = (all.findIndex((u) => u.id === stats.id) + 1) || null;
    res.json({ success: true, rank });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
