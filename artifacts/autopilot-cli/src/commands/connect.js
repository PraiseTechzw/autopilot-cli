const path = require('path');
const logger = require('../utils/logger');
const bridgeClient = require('../core/bridgeClient');
const git = require('../core/git');

async function connectCommand(code, options = {}) {
  const repoPath = options.cwd || process.cwd();

  if (options.disconnect) {
    await bridgeClient.clearSession(repoPath);
    logger.success('Cleared active Autopilot Web Bridge session.');
    return;
  }

  // Check if existing session
  let pairingCode = code;
  if (!pairingCode) {
    const existing = await bridgeClient.getStoredSession(repoPath);
    if (existing && existing.code) {
      pairingCode = existing.code;
    }
  }

  const customApi = options.api || process.env.AUTOPILOT_API_URL || null;
  const pairResult = await bridgeClient.pair(pairingCode, repoPath, customApi);

  const finalCode = pairResult.code;
  const webBaseUrl = options.webUrl || process.env.AUTOPILOT_WEB_URL || 'http://localhost:3000';
  const webLink = `${webBaseUrl}/playground?code=${finalCode}`;

  console.log('\n' + '='.repeat(70));
  console.log('  🚀 AUTOPILOT WEB BRIDGE — LIVE MACHINE CONNECTION');
  console.log('='.repeat(70));
  console.log(`  Pairing Code:   \x1b[32m\x1b[1m${finalCode}\x1b[0m`);
  console.log(`  Local Path:     ${repoPath}`);
  console.log(`  Active Branch:  \x1b[36m${pairResult.machineInfo?.branch || 'main'}\x1b[0m`);
  console.log(`  API Bridge:     ${pairResult.apiUrl || bridgeClient.apiUrl}`);
  console.log(`  Web Dashboard:  \x1b[34m\x1b[4m${webLink}\x1b[0m`);
  console.log('='.repeat(70));
  console.log('  🟢 Live Sync Active:');
  console.log('     • Web Terminal commands execute directly on this machine.');
  console.log('     • Watcher events and commits stream in real-time to your browser.');
  console.log('     • Press Ctrl+C in this terminal to disconnect.\n');

  // Open browser automatically if not in headless/ci
  if (!options.noOpen && !process.env.CI) {
    try {
      const { default: open } = await import('open');
      await open(webLink);
    } catch {
      // ignore
    }
  }

  // Start polling for remote commands from the web UI
  bridgeClient.startPolling(async (command, args, cwd) => {
    // Custom inline execution or process dispatch
    try {
      if (command === 'status') {
        const statusCmd = require('./status');
        let out = '';
        const oldLog = console.log;
        console.log = (...a) => { out += a.join(' ') + '\n'; oldLog(...a); };
        await statusCmd({ cwd });
        console.log = oldLog;
        return out;
      } else if (command === 'doctor') {
        const doctorCmd = require('./doctor');
        let out = '';
        const oldLog = console.log;
        console.log = (...a) => { out += a.join(' ') + '\n'; oldLog(...a); };
        await doctorCmd({ cwd });
        console.log = oldLog;
        return out;
      } else if (command === 'insights') {
        const { insights: insightsCmd } = require('./insights');
        let out = '';
        const oldLog = console.log;
        console.log = (...a) => { out += a.join(' ') + '\n'; oldLog(...a); };
        await insightsCmd({ cwd, format: 'text' });
        console.log = oldLog;
        return out;
      }
    } catch (err) {
      return `Error: ${err.message}`;
    }
  }, repoPath);

  // If --start was passed, start watcher as well
  if (options.start) {
    const Watcher = require('../core/watcher');
    const watcher = new Watcher(repoPath);
    await watcher.start();
  }

  // Keep process alive if foreground
  if (!options.detach) {
    process.on('SIGINT', async () => {
      console.log('\n\x1b[33mDisconnecting Autopilot Web Bridge...\x1b[0m');
      bridgeClient.stopPolling();
      process.exit(0);
    });
  }

  return pairResult;
}

module.exports = connectCommand;
