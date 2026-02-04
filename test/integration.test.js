const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs-extra');
const path = require('path');
const { execa } = require('execa'); // v5
const Watcher = require('../src/core/watcher');

// Test configuration
const TEST_DIR = path.join(__dirname, 'temp-test-repo');
const TEST_README = path.join(TEST_DIR, 'README.md');
const IGNORED_FILE = path.join(TEST_DIR, '.vscode/time-analytics.json');

async function setupRepo() {
  await fs.remove(TEST_DIR);
  await fs.ensureDir(TEST_DIR);
  await execa('git', ['init'], { cwd: TEST_DIR });
  await execa('git', ['config', 'user.name', 'Autopilot Test'], { cwd: TEST_DIR });
  await execa('git', ['config', 'user.email', 'test@example.com'], { cwd: TEST_DIR });
  
  // Create initial commit
  await fs.writeFile(TEST_README, '# Test Repo\nInitial content');
  await execa('git', ['add', '.'], { cwd: TEST_DIR });
  await execa('git', ['commit', '-m', 'Initial commit'], { cwd: TEST_DIR });
  
  // Create ignored directory
  await fs.ensureDir(path.dirname(IGNORED_FILE));
}

test('Integration: Watcher detects changes and commits', { timeout: 30000 }, async (t) => {
  await setupRepo();

  // Set environment for Test Mode
  process.env.AUTOPILOT_TEST_MODE = '1';
  process.env.AUTOPILOT_TEST_DURATION = '5000'; // 5 seconds
  
  // Start Watcher
  const watcher = new Watcher(TEST_DIR);
  
  // Mock config to ensure fast debounce
  watcher.config = {
    debounceSeconds: 1,
    minSecondsBetweenCommits: 0,
    autoPush: false, // Don't push in test
    blockedBranches: [],
    commitMessageMode: 'simple'
  };

  // We need to override reloadConfig so it doesn't overwrite our mock
  watcher.reloadConfig = async () => {};
  
  // Start watcher (will run for 5s then stop)
  const watcherPromise = watcher.start();

  // Wait a bit for watcher to initialize
  await new Promise(r => setTimeout(r, 1000));

  // 1. Spam ignored file
  console.log('Spamming ignored file...');
  await fs.writeFile(IGNORED_FILE, '{"data": 1}');
  await new Promise(r => setTimeout(r, 100));
  await fs.writeFile(IGNORED_FILE, '{"data": 2}');

  // 2. Modify tracked file
  console.log('Modifying README...');
  await fs.writeFile(TEST_README, '# Test Repo\nModified content');

  // Wait for watcher to finish
  await watcherPromise;

  // Verify
  const { stdout: log } = await execa('git', ['log', '--oneline'], { cwd: TEST_DIR });
  console.log('Git Log:', log);

  // Assertions
  assert.ok(log.includes('chore: auto-commit changes'), 'Should have auto-commit message');
  const commitCount = log.trim().split('\n').length;
  assert.ok(commitCount >= 2, 'Should have at least 2 commits (initial + auto)');
  
  // Cleanup
  await fs.remove(TEST_DIR);
});
