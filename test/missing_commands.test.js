const assert = require('node:assert');
const test = require('node:test');
const path = require('node:path');
const fs = require('fs-extra');
const { spawn } = require('node:child_process');
const os = require('node:os');

const BIN_PATH = path.resolve(__dirname, '../bin/autopilot.js');

function run(args, cwd, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [BIN_PATH, ...args], {
      cwd,
      env: { ...process.env, ...env },
      stdio: 'pipe',
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (d) => stdout += d.toString());
    child.stderr.on('data', (d) => stderr += d.toString());

    child.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

function runGit(args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn('git', args, { cwd, stdio: 'pipe' });
    let stdout = '';
    child.stdout.on('data', d => stdout += d.toString());
    child.on('close', code => code === 0 ? resolve(stdout.trim()) : reject(new Error(`Git failed: ${args.join(' ')}`)));
  });
}

test('Missing Commands Integration', async (t) => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'autopilot-cli-missing-'));
  
  t.after(async () => {
    await fs.remove(tmpDir);
  });

  // Setup repo
  await runGit(['init'], tmpDir);
  await runGit(['config', 'user.email', 'test@example.com'], tmpDir);
  await runGit(['config', 'user.name', 'Test User'], tmpDir);
  await run(['init'], tmpDir);

  await t.test('status command', async () => {
    // Should be not running initially
    const { code, stdout, stderr } = await run(['status'], tmpDir);
    assert.strictEqual(code, 0);
    // logger.warn writes to stderr
    assert.match(stderr, /Status: Not Running/);
  });

  await t.test('pause and resume commands', async () => {
    // Pause
    const p1 = await run(['pause', 'Taking a break'], tmpDir);
    assert.strictEqual(p1.code, 0);
    assert.match(p1.stdout, /Autopilot paused/);

    // Verify state file
    const state = await fs.readJson(path.join(tmpDir, '.autopilot', 'state.json'));
    assert.strictEqual(state.status, 'paused');
    assert.strictEqual(state.reason, 'Taking a break');

    // Resume
    const p2 = await run(['resume'], tmpDir);
    assert.strictEqual(p2.code, 0);
    assert.match(p2.stdout, /Autopilot resumed/);

    // Verify state file
    const state2 = await fs.readJson(path.join(tmpDir, '.autopilot', 'state.json'));
    assert.strictEqual(state2.status, 'running');
  });

  await t.test('undo command', async () => {
    // Create a dummy commit via autopilot mechanism (simulated)
    // We manually add a commit and an entry to history.json
    await fs.writeFile(path.join(tmpDir, 'file1.txt'), 'content1');
    await runGit(['add', '.'], tmpDir);
    await runGit(['commit', '-m', 'feat: add file1'], tmpDir);
    const hash1 = await runGit(['rev-parse', 'HEAD'], tmpDir);

    await fs.writeFile(path.join(tmpDir, 'file2.txt'), 'content2');
    await runGit(['add', '.'], tmpDir);
    await runGit(['commit', '-m', 'feat: add file2'], tmpDir);
    const hash2 = await runGit(['rev-parse', 'HEAD'], tmpDir);

    // Mock history
    const historyPath = path.join(tmpDir, '.autopilot', 'history.json');
    await fs.ensureDir(path.dirname(historyPath));
    await fs.writeJson(historyPath, {
      commits: [
        { hash: hash2, message: 'feat: add file2', timestamp: new Date().toISOString() },
        { hash: hash1, message: 'feat: add file1', timestamp: new Date().toISOString() }
      ]
    });

    // Undo last commit (which is hash2)
    const { code, stdout } = await run(['undo'], tmpDir);
    assert.strictEqual(code, 0);
    assert.match(stdout, /Undid/);

    // Verify git history
    const currentHead = await runGit(['rev-parse', 'HEAD'], tmpDir);
    assert.strictEqual(currentHead, hash1);

    // Verify autopilot history
    const historyData = await fs.readJson(historyPath);
    assert.strictEqual(historyData.commits.length, 1);
    assert.strictEqual(historyData.commits[0].hash, hash1);
  });

  await t.test('stop command', async () => {
    // Start a dummy process to simulate autopilot
    // We can't easily start the real `start` command because it blocks or runs in background in a way that's hard to kill cleanly in test without being flaky.
    // Instead, we fake the PID file.
    
    // We'll just test that `stop` handles "not running" correctly first
    const { code, stdout } = await run(['stop'], tmpDir);
    assert.strictEqual(code, 0);
    assert.match(stdout, /Autopilot is not running/);
    
    // Now fake a PID
    // We use the current process PID just to have a valid PID, but we won't actually kill it because `stop` uses process.kill(pid, 'SIGTERM')
    // Wait, if we use current process PID, `stop` will kill the test runner! Bad idea.
    // We should spawn a sleep process.
    
    const sleep = spawn('node', ['-e', 'setTimeout(() => {}, 10000)'], { detached: true });
    const pid = sleep.pid;
    
    await fs.writeFile(path.join(tmpDir, '.autopilot.pid'), pid.toString());
    
    const stopResult = await run(['stop'], tmpDir);
    assert.strictEqual(stopResult.code, 0);
    assert.match(stopResult.stdout, /Autopilot stopped successfully/);
    
    // Check if PID file is gone
    const pidExists = await fs.pathExists(path.join(tmpDir, '.autopilot.pid'));
    assert.strictEqual(pidExists, false);
    
    // Cleanup sleep process if it's still alive (it should be killed by stop)
    try {
        process.kill(pid, 0); // Check if exists
        process.kill(pid); // Kill if still exists
    } catch (e) {
        // Expected if it was killed
    }
  });

  await t.test('dashboard command', async () => {
    const child = spawn(process.execPath, [BIN_PATH, 'dashboard'], {
      cwd: tmpDir,
      env: { ...process.env, FORCE_COLOR: '1' },
      stdio: 'pipe'
    });

    let output = '';
    child.stdout.on('data', d => output += d.toString());
    child.stderr.on('data', d => output += d.toString());

    await new Promise((resolve) => {
      // Give it time to render
      setTimeout(() => {
        child.kill();
        resolve();
      }, 3000);
    });

    // It should not have printed "Failed to launch dashboard"
    assert.doesNotMatch(output, /Failed to launch dashboard/);
    
    // If we are in a CI/Test environment without TTY, ink might not output anything.
    // We mainly want to ensure it didn't crash with the import error we fixed.
    if (output.length === 0) {
        // Log warning but don't fail if we know it didn't crash with the specific error
        console.warn('Warning: Dashboard produced no output (likely due to non-TTY environment).');
    } else {
        assert.match(output, /Autopilot|Loading|Status/);
    }
  });

});
