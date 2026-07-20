import { Router } from "express";

const router = Router();

// GET /api/version — returns latest npm version
router.get("/version", async (_req, res) => {
  try {
    const response = await fetch("https://registry.npmjs.org/@traisetech/autopilot/latest");
    if (!response.ok) {
      res.json({ version: "4.0.2" });
      return;
    }
    const data = await response.json() as { version: string };
    res.json({ version: data.version || "4.0.2" });
  } catch {
    res.json({ version: "4.0.2" });
  }
});

// GET /api/downloads — returns download stats
router.get("/downloads", async (_req, res) => {
  try {
    const [weeklyRes, totalRes] = await Promise.allSettled([
      fetch("https://api.npmjs.org/downloads/point/last-week/@traisetech/autopilot"),
      fetch(`https://api.npmjs.org/downloads/range/2024-01-01:${new Date().toISOString().split("T")[0]}/@traisetech/autopilot`),
    ]);

    let weekly = 0;
    let total = 0;

    if (weeklyRes.status === "fulfilled" && weeklyRes.value.ok) {
      const d = await weeklyRes.value.json() as { downloads: number };
      weekly = d.downloads || 0;
    }

    if (totalRes.status === "fulfilled" && totalRes.value.ok) {
      const d = await totalRes.value.json() as { downloads: Array<{ downloads: number }> };
      if (Array.isArray(d.downloads)) {
        total = d.downloads.reduce((acc, day) => acc + day.downloads, 0);
      }
    }

    res.json({ weekly, total });
  } catch {
    res.json({ weekly: 0, total: 0 });
  }
});

export default router;
