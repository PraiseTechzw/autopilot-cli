const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');
const logger = require('../utils/logger');
const git = require('./git');

const DEFAULT_API_URL = process.env.AUTOPILOT_API_URL || 'http://localhost:5000';
const PRODUCTION_WEB_URL = 'https://autopilot-cli.vercel.app';

function getBridgeSessionPath(repoPath = process.cwd()) {
  return path.join(repoPath, '.autopilot', 'bridge-session.json');
}

class BridgeClient {
  constructor() {
    this.apiUrl = process.env.AUTOPILOT_API_URL || 'http://localhost:5000';
    this.sessionCode = null;
    this.isPolling = false;
    this.pollTimer = null;
    this.heartbeatTimer = null;
    this.commandHandler = null;
  }

  setApiUrl(url) {
    if (url) this.apiUrl = url.replace(/\/$/, '');
  }

  async getStoredSession(repoPath = process.cwd()) {
    try {
      const sessPath = getBridgeSessionPath(repoPath);
      if (await fs.pathExists(sessPath)) {
        const data = await fs.readJson(sessPath);
        if (data && data.code) {
          return data;
        }
      }
    } catch {
      // ignore
    }
    return null;
  }

  async saveSession(sessionData, repoPath = process.cwd()) {
    try {
      const sessPath = getBridgeSessionPath(repoPath);
      await fs.ensureDir(path.dirname(sessPath));
      await fs.writeJson(sessPath, sessionData, { spaces: 2 });
    } catch (err) {
      logger.debug(`Failed to save bridge session: ${err.message}`);
    }
  }

  async clearSession(repoPath = process.cwd()) {
    try {
      const sessPath = getBridgeSessionPath(repoPath);
      if (await fs.pathExists(sessPath)) {
        await fs.remove(sessPath);
      }
    } catch {
      // ignore
    }
  }

  async collectMachineInfo(repoPath = process.cwd()) {
    let branch = 'unknown';
    let commits = [];
    let remotes = [];

    try {
      const branchRes = await git.runGit(repoPath, ['rev-parse', '--abbrev-ref', 'HEAD']);
      branch = branchRes.stdout?.trim() || 'main';
    } catch {
      // non-git or initial
    }

    try {
      const remoteRes = await git.runGit(repoPath, ['remote', '-v']);
      remotes = remoteRes.stdout ? remoteRes.stdout.split('\n').filter(Boolean) : [];
    } catch {
      // ignore
    }

    try {
      const logRes = await git.runGit(repoPath, ['log', '-n', '10', '--pretty=format:%h|%s|%an|%cr']);
      if (logRes.stdout) {
        commits = logRes.stdout.split('\n').filter(Boolean).map(line => {
          const [hash, message, author, timestamp] = line.split('|');
          return {
            hash: hash || '0000000',
            message: message || '',
            author: author || 'Developer',
            timestamp: timestamp || 'just now',
            branch: branch
          };
        });
      }
    } catch {
      // ignore
    }

    let pkgVersion = '4.0.2';
    try {
      const pkg = require('../../package.json');
      pkgVersion = pkg.version || '4.0.2';
    } catch {
      // ignore
    }

    return {
      hostname: os.hostname(),
      platform: `${os.type()} ${os.release()} (${os.arch()})`,
      repoPath: repoPath,
      repoName: path.basename(repoPath),
      branch,
      remotes,
      commits,
      version: pkgVersion,
      status: 'ready',
      timestamp: Date.now()
    };
  }

  async pair(code, repoPath = process.cwd(), customApiUrl = null) {
    if (customApiUrl) this.setApiUrl(customApiUrl);

    const normalizedCode = code ? code.toUpperCase().trim() : this.generateCode();
    this.sessionCode = normalizedCode;

    const machineInfo = await this.collectMachineInfo(repoPath);

    const endpoints = [
      this.apiUrl,
      'http://localhost:5000',
      'https://autopilot-cli.vercel.app'
    ];

    let success = false;
    let connectedApi = this.apiUrl;
    let lastError = null;

    for (const ep of endpoints) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(`${ep}/api/bridge/pair`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: normalizedCode,
            machineInfo
          }),
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (res.ok) {
          success = true;
          connectedApi = ep;
          this.apiUrl = ep;
          break;
        }
      } catch (e) {
        lastError = e;
      }
    }

    if (!success) {
      // If server unreachable, still store session for offline/direct bridging
      await this.saveSession({
        code: normalizedCode,
        apiUrl: this.apiUrl,
        connectedAt: Date.now(),
        repoPath
      }, repoPath);
      return {
        success: false,
        code: normalizedCode,
        error: lastError ? lastError.message : 'Server not responding'
      };
    }

    await this.saveSession({
      code: normalizedCode,
      apiUrl: connectedApi,
      connectedAt: Date.now(),
      repoPath
    }, repoPath);

    return {
      success: true,
      code: normalizedCode,
      apiUrl: connectedApi,
      machineInfo
    };
  }

  generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = 'AP-';
    for (let i = 0; i < 4; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  }

  async emitEvent(type, payload, repoPath = process.cwd()) {
    if (!this.sessionCode) {
      const sess = await this.getStoredSession(repoPath);
      if (sess && sess.code) {
        this.sessionCode = sess.code;
        if (sess.apiUrl) this.apiUrl = sess.apiUrl;
      }
    }

    if (!this.sessionCode) return;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      await fetch(`${this.apiUrl}/api/bridge/event/${this.sessionCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, payload }),
        signal: controller.signal
      });
      clearTimeout(timeout);
    } catch {
      // Ignore background delivery failures
    }
  }

  startPolling(commandHandler, repoPath = process.cwd()) {
    this.commandHandler = commandHandler;
    if (this.isPolling) return;
    this.isPolling = true;

    // Heartbeat loop
    this.heartbeatTimer = setInterval(async () => {
      if (!this.sessionCode) return;
      try {
        await fetch(`${this.apiUrl}/api/bridge/ping/${this.sessionCode}`, {
          method: 'POST'
        });
      } catch {
        // ignore
      }
    }, 10000);

    // Command poll loop
    const poll = async () => {
      if (!this.isPolling) return;
      try {
        if (this.sessionCode) {
          const res = await fetch(`${this.apiUrl}/api/bridge/pending-commands/${this.sessionCode}`);
          if (res.ok) {
            const data = await res.json();
            if (data && Array.isArray(data.commands) && data.commands.length > 0) {
              for (const cmd of data.commands) {
                await this.executeRemoteCommand(cmd, repoPath);
              }
            }
          }
        }
      } catch {
        // ignore poll errors
      } finally {
        if (this.isPolling) {
          this.pollTimer = setTimeout(poll, 1500);
        }
      }
    };

    poll();
  }

  async executeRemoteCommand(cmd, repoPath) {
    const { id, command, args } = cmd;
    logger.info(`[Web Bridge] Executing remote command: ${command} ${(args || []).join(' ')}`);

    let output = '';
    let exitCode = 0;
    let error = null;

    try {
      if (this.commandHandler) {
        output = await this.commandHandler(command, args, repoPath);
      } else {
        // Default runner
        const execa = require('execa');
        const proc = await execa('node', [path.resolve(__dirname, '../../bin/autopilot.js'), command, ...(args || [])], {
          cwd: repoPath,
          reject: false,
          env: { ...process.env, FORCE_COLOR: '0' }
        });
        output = proc.stdout || proc.stderr || '';
        exitCode = proc.exitCode;
      }
    } catch (err) {
      exitCode = 1;
      error = err.message;
      output = err.message;
    }

    try {
      await fetch(`${this.apiUrl}/api/bridge/command-result/${this.sessionCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commandId: id,
          command,
          output,
          exitCode,
          error
        })
      });
    } catch {
      // ignore
    }
  }

  stopPolling() {
    this.isPolling = false;
    if (this.pollTimer) clearTimeout(this.pollTimer);
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
  }
}

module.exports = new BridgeClient();
