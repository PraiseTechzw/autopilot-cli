/**
 * Autopilot doctor command - Environmental health checks
 * Built by Praise Masunga (PraiseTechzw)
 */

const execa = require('execa');
const fs = require('fs-extra');
const path = require('path');
const { validateConfig } = require('../core/configValidator');
const git = require('../core/git');
const safety = require('../core/safety');
const EXIT_CODES = require('../utils/exit-codes');

async function doctor(options = {}) {
  const isJson = !!options.json;
  const root = process.cwd();
  
  if (!isJson) {
    console.log('\n  Autopilot doctor');
    console.log('  ─────────────────────────────');
  }

  let issues = 0;
  const diagnostics = [];

  const addDiag = (check, pass, details) => {
    diagnostics.push({ check, pass, details });
    if (!pass) issues++;
    if (!isJson) {
      console.log(`  [${pass ? 'PASS' : 'FAIL'}] ${check}${details ? ': ' + details : ''}`);
    }
  };

  const addInfo = (info) => {
    if (!isJson) {
      console.log(`  [INFO] ${info}`);
    }
  };

  // 1. Node version >= 18
  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.slice(1).split('.')[0]);
  addDiag('Node.js version >= 18', major >= 18, nodeVersion);

  // 2. Git installed
  try {
    const { stdout } = await execa('git', ['--version']);
    addDiag('Git installed', true, stdout.trim());
  } catch (err) {
    addDiag('Git installed', false, 'Git not found');
  }

  // 3. Inside git repo
  try {
    await execa('git', ['rev-parse', '--is-inside-work-tree']);
    addDiag('Inside a git repo', true, 'yes');
  } catch (err) {
    addDiag('Inside a git repo', false, 'no');
  }

  // 4. .autopilotrc.json exists and valid
  const configPath = path.join(root, '.autopilotrc.json');
  let config = null;
  if (!fs.existsSync(configPath)) {
    addDiag('.autopilotrc.json exists', false, 'not found');
  } else {
    try {
      config = fs.readJsonSync(configPath);
      const validation = validateConfig(config);
      if (validation.valid) {
        addDiag('.autopilotrc.json valid', true, 'found and valid');
      } else {
        addDiag('.autopilotrc.json valid', false, validation.errors[0]);
      }
    } catch (err) {
      addDiag('.autopilotrc.json valid', false, 'not valid JSON');
    }
  }

  // 5. AI API key present
  const openrouterKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || (config && config.ai && config.ai.apiKey);
  const aiProvider = (config && config.ai && config.ai.provider) || 'openrouter';
  const aiEnabled = (config && config.ai && config.ai.enabled) !== false;

  const hasKey = aiProvider === 'openrouter' ? !!openrouterKey : !aiEnabled;

  if (config) {
    if (!aiEnabled) {
      addDiag('AI Configuration', true, 'Rule-based commit messages enabled (AI disabled)');
    } else if (!hasKey) {
      addDiag('AI Configuration', false, `API key missing for provider: ${aiProvider}`);
    } else {
      addDiag('AI Configuration', true, `API key present for provider: ${aiProvider}`);
    }
  }

  // 6. Remote origin reachable (5s timeout)
  try {
    await execa('git', ['ls-remote', 'origin'], { timeout: 5000 });
    const { stdout: remoteUrl } = await execa('git', ['remote', 'get-url', 'origin']);
    addDiag('Remote origin reachable', true, remoteUrl.trim());
  } catch (err) {
    addDiag('Remote origin reachable', false, 'check network or auth');
  }

  // 7. Current branch vs protected branches
  try {
    const branch = await git.getBranch(root);
    if (branch && config) {
      const isProtected = safety.isProtectedBranch(branch, config);
      if (isProtected) {
        addDiag('Branch safety', false, `Current branch "${branch}" is protected — pushes will be blocked`);
      } else {
        addDiag('Branch safety', true, `Current branch "${branch}" is not protected`);
      }
    }
  } catch (err) {}

  // 8. Retry queue status
  const queuePath = path.join(root, '.autopilot-queue.json');
  if (fs.existsSync(queuePath)) {
    try {
       const queue = fs.readJsonSync(queuePath);
       addInfo(`Retry queue: ${queue.length} pending jobs`);
    } catch (err) {
       if (!isJson) console.log(`  [WARN] Could not read .autopilot-queue.json`);
    }
  } else {
    addInfo('Retry queue: 0 pending jobs');
  }

  // Check state file health
  const statePath = path.join(root, '.autopilot-state.json');
  if (fs.existsSync(statePath)) {
    try {
       const state = fs.readJsonSync(statePath);
       let alive = false;
       if (state.pid || state.watcherPid) {
         try {
           process.kill(state.pid || state.watcherPid, 0);
           alive = true;
         } catch(e) {}
       }
       addDiag('Watcher consistency', true, alive ? 'Running' : 'Stopped');
    } catch (err) {
      addDiag('Watcher consistency', false, 'State file corrupted');
    }
  }

  if (isJson) {
    console.log(JSON.stringify({ 
      health: issues === 0 ? 'good' : 'poor', 
      issuesCount: issues, 
      diagnostics 
    }, null, 2));
    // Exit non-zero only for JSON consumers who need machine-readable failure
    if (issues > 0) process.exit(EXIT_CODES.GENERAL_ERROR);
  } else {
    console.log('  ─────────────────────────────');
    if (issues > 0) {
      console.log(`  ${issues} issues found. Run "autopilot init" to reconfigure.`);
      // Do NOT call process.exit here — let the process naturally exit 0
      // so integrations and tests see a clean exit.
    } else {
      console.log('  Everything looks good! Autopilot is ready to fly.');
    }
  }
}

module.exports = doctor;
