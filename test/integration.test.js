const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs-extra');
const path = require('path');
const execa = require('execa'); // v5
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
  
  // Mock process.exit to prevent killing the test runner
  const originalExit = process.exit;
  let exitCode = null;
  process.exit = (code) => {
    exitCode = code;
    console.log(`Mock process.exit called with code ${code}`);
  };

  try {
    // Start watcher (will run for 5s then stop)
    await watcher.start();

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

    // Wait for the test duration (plus a buffer) for the watcher to process and "exit"
    console.log('Waiting for watcher to process...');
    await new Promise(r => setTimeout(r, 6000)); // 5000 duration + 1000 buffer

    // Verify
    const { stdout: log } = await execa('git', ['log', '--oneline'], { cwd: TEST_DIR });
    console.log('Git Log:', log);

    // Assertions
    assert.ok(log.includes('chore: auto-commit changes'), 'Should have auto-commit message');
    const commitCount = log.trim().split('\n').length;
    assert.ok(commitCount >= 2, 'Should have at least 2 commits (initial + auto)');
    
    // Check if exit was called
    assert.strictEqual(exitCode, 0, 'Watcher should have called process.exit(0)');

  } finally {
    // Restore process.exit
    process.exit = originalExit;

    // Cleanup
    if (watcher.isWatching) {
      await watcher.stop();
    }
    // Wait a bit for processes to release locks
    await new Promise(r => setTimeout(r, 1000));
    try {
      await fs.remove(TEST_DIR);
    } catch (e) {
      // Ignore EBUSY on Windows during cleanup
      if (e.code !== 'EBUSY') console.error('Cleanup error:', e);
    }
    delete process.env.AUTOPILOT_TEST_MODE;
    delete process.env.AUTOPILOT_TEST_DURATION;
  }
});
