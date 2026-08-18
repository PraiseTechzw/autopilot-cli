import { Router, type Response } from "express";
import crypto from "crypto";

interface MachineInfo {
  hostname?: string;
  platform?: string;
  repoPath?: string;
  branch?: string;
  remotes?: string[];
  status?: string;
  commits?: Array<{
    hash: string;
    message: string;
    author: string;
    timestamp: string;
    branch?: string;
    tag?: string;
    diff?: string;
  }>;
  metrics?: {
    focusMinutes?: number;
    commitsCount?: number;
    streak?: number;
    score?: number;
  };
  version?: string;
}

interface PendingCommand {
  id: string;
  command: string;
  args: string[];
  createdAt: number;
}

interface BridgeSession {
  code: string;
  sessionId: string;
  createdAt: number;
  lastPing: number;
  paired: boolean;
  machineInfo?: MachineInfo;
  pendingCommands: PendingCommand[];
  sseClients: Set<Response>;
}

const sessions = new Map<string, BridgeSession>();

// Cleanup stale sessions after 2 hours
setInterval(() => {
  const now = Date.now();
  for (const [code, session] of sessions.entries()) {
    if (now - session.lastPing > 2 * 60 * 60 * 1000 && session.sseClients.size === 0) {
      sessions.delete(code);
    }
  }
}, 10 * 60 * 1000);

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "AP-";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function broadcastToClients(session: BridgeSession, eventType: string, data: any) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of session.sseClients) {
    try {
      client.write(payload);
    } catch {
      session.sseClients.delete(client);
    }
  }
}

const router = Router();

// Create or initialize a session
router.post("/bridge/session", (req, res) => {
  let requestedCode = req.body?.code?.toUpperCase()?.trim();
  if (!requestedCode || requestedCode.length < 3) {
    requestedCode = generateCode();
  }

  let session = sessions.get(requestedCode);
  if (!session) {
    session = {
      code: requestedCode,
      sessionId: crypto.randomUUID(),
      createdAt: Date.now(),
      lastPing: Date.now(),
      paired: false,
      pendingCommands: [],
      sseClients: new Set(),
    };
    sessions.set(requestedCode, session);
  }

  res.json({
    success: true,
    code: session.code,
    sessionId: session.sessionId,
    paired: session.paired,
    machineInfo: session.machineInfo || null,
  });
});

// Pair CLI with code
router.post("/bridge/pair", (req, res) => {
  const { code, machineInfo } = req.body;
  if (!code) {
    res.status(400).json({ error: "Missing pairing code" });
    return;
  }

  const normalizedCode = code.toUpperCase().trim();
  let session = sessions.get(normalizedCode);
  if (!session) {
    session = {
      code: normalizedCode,
      sessionId: crypto.randomUUID(),
      createdAt: Date.now(),
      lastPing: Date.now(),
      paired: true,
      machineInfo: machineInfo || {},
      pendingCommands: [],
      sseClients: new Set(),
    };
    sessions.set(normalizedCode, session);
  } else {
    session.paired = true;
    session.lastPing = Date.now();
    session.machineInfo = {
      ...session.machineInfo,
      ...machineInfo,
    };
  }

  broadcastToClients(session, "paired", {
    code: session.code,
    machineInfo: session.machineInfo,
    timestamp: Date.now(),
  });

  res.json({
    success: true,
    code: session.code,
    sessionId: session.sessionId,
    message: `Paired successfully with session ${session.code}`,
  });
});

// Get session state
router.get("/bridge/state/:code", (req, res) => {
  const normalizedCode = req.params.code.toUpperCase().trim();
  const session = sessions.get(normalizedCode);
  if (!session) {
    res.status(404).json({ error: "Session not found", paired: false });
    return;
  }

  const isAlive = Date.now() - session.lastPing < 60000;
  res.json({
    success: true,
    code: session.code,
    paired: session.paired,
    connected: session.paired && isAlive,
    machineInfo: session.machineInfo || null,
    lastPing: session.lastPing,
    pendingCommandsCount: session.pendingCommands.length,
  });
});

// SSE Stream for Real-time bidirectional updates
router.get("/bridge/stream/:code", (req, res) => {
  const normalizedCode = req.params.code.toUpperCase().trim();
  let session = sessions.get(normalizedCode);

  if (!session) {
    session = {
      code: normalizedCode,
      sessionId: crypto.randomUUID(),
      createdAt: Date.now(),
      lastPing: Date.now(),
      paired: false,
      pendingCommands: [],
      sseClients: new Set(),
    };
    sessions.set(normalizedCode, session);
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  res.flushHeaders?.();

  session.sseClients.add(res);

  // Send initial state
  res.write(
    `event: init\ndata: ${JSON.stringify({
      code: session.code,
      paired: session.paired,
      machineInfo: session.machineInfo || null,
      timestamp: Date.now(),
    })}\n\n`,
  );

  // Keep-alive heartbeat
  const heartbeat = setInterval(() => {
    try {
      res.write(`event: ping\ndata: ${JSON.stringify({ time: Date.now() })}\n\n`);
    } catch {
      clearInterval(heartbeat);
      session?.sseClients.delete(res);
    }
  }, 15000);

  req.on("close", () => {
    clearInterval(heartbeat);
    session?.sseClients.delete(res);
  });
});

// Post live event from CLI to Web (e.g. file change, debounce countdown, new commit)
router.post("/bridge/event/:code", (req, res) => {
  const normalizedCode = req.params.code.toUpperCase().trim();
  const session = sessions.get(normalizedCode);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const { type, payload } = req.body;
  if (!type) {
    res.status(400).json({ error: "Missing event type" });
    return;
  }

  session.lastPing = Date.now();

  // If payload contains updated status or machine info, merge it
  if (type === "status_update" && payload?.machineInfo) {
    session.machineInfo = {
      ...session.machineInfo,
      ...payload.machineInfo,
    };
  }

  broadcastToClients(session, type, {
    type,
    payload,
    timestamp: Date.now(),
  });

  res.json({ success: true, clientsNotified: session.sseClients.size });
});

// Post command from Web to CLI
router.post("/bridge/command/:code", (req, res) => {
  const normalizedCode = req.params.code.toUpperCase().trim();
  const session = sessions.get(normalizedCode);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const { command, args } = req.body;
  if (!command) {
    res.status(400).json({ error: "Missing command string" });
    return;
  }

  const cmdId = crypto.randomUUID();
  const cmd: PendingCommand = {
    id: cmdId,
    command: command.trim(),
    args: Array.isArray(args) ? args : [],
    createdAt: Date.now(),
  };

  session.pendingCommands.push(cmd);

  // Notify SSE clients and CLI
  broadcastToClients(session, "command_dispatched", cmd);

  res.json({
    success: true,
    commandId: cmdId,
    command: cmd.command,
  });
});

// CLI polls for pending commands
router.get("/bridge/pending-commands/:code", (req, res) => {
  const normalizedCode = req.params.code.toUpperCase().trim();
  const session = sessions.get(normalizedCode);
  if (!session) {
    res.status(404).json({ error: "Session not found", commands: [] });
    return;
  }

  session.lastPing = Date.now();

  // Pop all pending commands
  const commands = [...session.pendingCommands];
  session.pendingCommands = [];

  res.json({
    success: true,
    commands,
  });
});

// CLI posts command execution result
router.post("/bridge/command-result/:code", (req, res) => {
  const normalizedCode = req.params.code.toUpperCase().trim();
  const session = sessions.get(normalizedCode);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const { commandId, command, output, exitCode, error } = req.body;
  session.lastPing = Date.now();

  broadcastToClients(session, "command_result", {
    commandId,
    command,
    output: output || "",
    exitCode: exitCode ?? 0,
    error: error || null,
    timestamp: Date.now(),
  });

  res.json({ success: true });
});

// Heartbeat ping
router.post("/bridge/ping/:code", (req, res) => {
  const normalizedCode = req.params.code.toUpperCase().trim();
  const session = sessions.get(normalizedCode);
  if (session) {
    session.lastPing = Date.now();
  }
  res.json({ success: true, time: Date.now() });
});

export default router;
