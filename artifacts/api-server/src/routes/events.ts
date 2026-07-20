import { Router } from "express";

const router = Router();

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

// POST /api/events
router.post("/events", async (req, res) => {
  try {
    const body = req.body;
    if (!body || !body.type) {
      res.status(400).json({ error: "Invalid event payload" });
      return;
    }

    const supabase = await getSupabaseClient();
    if (!supabase) {
      // Graceful no-op when Supabase is not configured
      res.json({ success: true, skipped: true });
      return;
    }

    const enriched = {
      type: body.type,
      user_id: body.userId ?? null,
      commit_hash: body.commitHash ?? null,
      timestamp: body.timestamp ?? null,
      version: body.version ?? null,
      queued_at: body.queuedAt ?? null,
      retry_count: body.retryCount ?? 0,
      received_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("events").insert(enriched);
    if (error) {
      res.status(500).json({ error: "Failed to store event" });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
