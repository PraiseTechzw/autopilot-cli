import { Router } from "express";
import crypto from "crypto";

const router = Router();
const connections = new Map<string, { login: string; connectedAt: string; token: string }>();
const stateTtlMs = 10 * 60 * 1000;

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function sign(value: string): string {
  return crypto.createHmac("sha256", required("GITHUB_OAUTH_STATE_SECRET")).update(value).digest("base64url");
}

function encrypt(token: string): string {
  const key = Buffer.from(required("SESSION_ENCRYPTION_KEY"), "base64");
  if (key.length !== 32) throw new Error("SESSION_ENCRYPTION_KEY must be a base64-encoded 32-byte key");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`;
}

function webUrl(): string { return process.env["AUTOPILOT_WEB_URL"] || "http://localhost:3000"; }

router.get("/github/status/:code", (req, res) => {
  const entry = connections.get(req.params.code.toUpperCase());
  res.json({ connected: Boolean(entry), login: entry?.login ?? null, connectedAt: entry?.connectedAt ?? null });
});

router.get("/github/login", (req, res) => {
  try {
    const sessionCode = String(req.query.code || "").toUpperCase().trim();
    if (!/^AP-[A-Z0-9-]{4,64}$/.test(sessionCode)) return res.status(400).json({ error: "A valid pairing code is required" });
    const callback = required("GITHUB_OAUTH_CALLBACK_URL");
    const payload = Buffer.from(JSON.stringify({ sessionCode, expiresAt: Date.now() + stateTtlMs, nonce: crypto.randomUUID() })).toString("base64url");
    const state = `${payload}.${sign(payload)}`;
    const query = new URLSearchParams({ client_id: required("GITHUB_CLIENT_ID"), redirect_uri: callback, state, scope: "read:user" });
    return res.redirect(`https://github.com/login/oauth/authorize?${query}`);
  } catch (error) {
    return res.status(503).json({ error: error instanceof Error ? error.message : "GitHub OAuth is unavailable" });
  }
});

router.get("/github/callback", async (req, res) => {
  try {
    const [payload, signature] = String(req.query.state || "").split(".");
    if (!payload || !signature || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(sign(payload)))) throw new Error("Invalid OAuth state");
    const state = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!state.sessionCode || Date.now() > state.expiresAt) throw new Error("OAuth state has expired");
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: required("GITHUB_CLIENT_ID"), client_secret: required("GITHUB_CLIENT_SECRET"), code: req.query.code }),
    });
    const tokenData = await tokenResponse.json() as { access_token?: string; error_description?: string };
    if (!tokenResponse.ok || !tokenData.access_token) throw new Error(tokenData.error_description || "GitHub authorization failed");
    const profileResponse = await fetch("https://api.github.com/user", { headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: "application/vnd.github+json", "User-Agent": "autopilot-cli" } });
    const profile = await profileResponse.json() as { login?: string };
    if (!profileResponse.ok || !profile.login) throw new Error("Could not retrieve GitHub profile");
    connections.set(state.sessionCode, { login: profile.login, connectedAt: new Date().toISOString(), token: encrypt(tokenData.access_token) });
    res.redirect(`${webUrl()}/playground?code=${encodeURIComponent(state.sessionCode)}&github=connected`);
  } catch (error) {
    res.redirect(`${webUrl()}/playground?github=error&reason=${encodeURIComponent(error instanceof Error ? error.message : "OAuth failed")}`);
  }
});

export default router;
