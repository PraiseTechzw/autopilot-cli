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

async function doctor() {
  const root = process.cwd();
  console.log('\n  Autopilot doctor');
  console.log('  ─────────────────────────────');

  let issues = 0;

  // 1. Node version >= 18
  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.slice(1).split('.')[0]);
  if (major >= 18) {
    console.log(`  [PASS] Node.js version: ${nodeVersion} (>=18 required)`);
  } else {
    console.log(`  [FAIL] Node.js version: ${nodeVersion} (>=18 required)`);
    issues++;
  }

  // 2. Git installed
  try {
    const { stdout } = await execa('git', ['--version']);
    console.log(`  [PASS] Git installed: ${stdout.trim()}`);
  } catch (err) {
    console.log(`  [FAIL] Git not found`);
    issues++;
  }

  // 3. Inside git repo
  try {
    await execa('git', ['rev-parse', '--is-inside-work-tree']);
    console.log(`  [PASS] Inside a git repo: yes`);
  } catch (err) {
    console.log(`  [FAIL] Inside a git repo: no`);
    issues++;
  }

  // 4. .autopilotrc.json exists and valid
  const configPath = path.join(root, '.autopilotrc.json');
  let config = null;
  if (!fs.existsSync(configPath)) {
    console.log(`  [FAIL] .autopilotrc.json not found`);
    issues++;
  } else {
    try {
      config = fs.readJsonSync(configPath);
      const validation = validateConfig(config);
      if (validation.valid) {
        console.log(`  [PASS] .autopilotrc.json found and valid`);
      } else {
        console.log(`  [FAIL] .autopilotrc.json has errors: ${validation.errors[0]}`);
        issues++;
      }
    } catch (err) {
      console.log(`  [FAIL] .autopilotrc.json is not valid JSON`);
      issues++;
    }
  }

  // 5. AI API key present
  const geminiKey = config?.aiApiKey || process.env.GEMINI_API_KEY;
  const grokKey = config?.aiApiKey || process.env.GROK_API_KEY; // Actually need to know which one to check
  const hasKey = (config?.aiProvider === 'gemini' && geminiKey) || 
                 (config?.aiProvider === 'grok' && grokKey) ||
                 (config?.aiProvider === 'none');
  
  if (config) {
    if (config.aiProvider === 'none') {
      console.log(`  [PASS] Rule-based commit messages enabled (No AI provider)`);
    } else if (!hasKey) {
      console.log(`  [FAIL] AI API key missing for provider: ${config.aiProvider}`);
      issues++;
    } else {
      console.log(`  [PASS] AI API key present for provider: ${config.aiProvider}`);
    }
  }

  // 6. Remote origin reachable (5s timeout)
  try {
    await execa('git', ['ls-remote', 'origin'], { timeout: 5000 });
    const { stdout: remoteUrl } = await execa('git', ['remote', 'get-url', 'origin']);
    console.log(`  [PASS] Remote origin reachable: ${remoteUrl.trim()}`);
  } catch (err) {
    console.log(`  [FAIL] Remote origin not reachable (check network or auth)`);
    issues++;
  }

  // 7. Current branch vs protected branches
  try {
    const branch = await git.getBranch(root);
    if (branch && config) {
      const isProtected = safety.isProtectedBranch(branch, config);
      if (isProtected) {
        console.log(`  [FAIL] Current branch "${branch}" is protected — pushes will be blocked`);
        issues++;
      } else {
        console.log(`  [PASS] Current branch "${branch}" is not protected`);
      }
    }
  } catch (err) {}

  // 8. Retry queue status
  const queuePath = path.join(root, '.autopilot-queue.json');
  if (fs.existsSync(queuePath)) {
    try {
       const queue = fs.readJsonSync(queuePath);
       console.log(`  [INFO] Retry queue: ${queue.length} pending jobs`);
    } catch (err) {
       console.log(`  [WARN] Could not read .autopilot-queue.json`);
    }
  } else {
     console.log(`  [PASS] Retry queue: 0 pending jobs`);
  }

  console.log('  ─────────────────────────────');
  if (issues > 0) {
    console.log(`  ${issues} issues found. Run "autopilot init" to reconfigure.`);
  } else {
    console.log('  Everything looks good! Autopilot is ready to fly.');
  }
}

module.exports = doctor;
