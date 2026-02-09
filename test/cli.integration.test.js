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
      stdio: 'pipe', // Capture output
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

test('CLI Integration', async (t) => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'autopilot-cli-test-'));
  
  t.after(async () => {
    await fs.remove(tmpDir);
  });

  await t.test('init command', async () => {
    // Setup git repo
    await runGit(['init'], tmpDir);
    await runGit(['config', 'user.email', 'test@example.com'], tmpDir);
    await runGit(['config', 'user.name', 'Test User'], tmpDir);

    const { code, stdout } = await run(['init'], tmpDir);
    assert.strictEqual(code, 0);
    assert.match(stdout, /Created \.autopilotrc\.json/);
    
    const hasConfig = await fs.pathExists(path.join(tmpDir, '.autopilotrc.json'));
    const hasIgnore = await fs.pathExists(path.join(tmpDir, '.autopilotignore'));
    assert.ok(hasConfig, 'Config file created');
    assert.ok(hasIgnore, 'Ignore file created');

    const ignoreContent = await fs.readFile(path.join(tmpDir, '.autopilotignore'), 'utf-8');
    assert.match(ignoreContent, /\.vscode\//);
    assert.match(ignoreContent, /autopilot\.log/);
  });

  await t.test('watcher integration with noisy files', async () => {
    // Override config for faster test
    await fs.writeJson(path.join(tmpDir, '.autopilotrc.json'), {
      debounceSeconds: 1,
      minSecondsBetweenCommits: 0,
      autoPush: false
    });

    // Create initial commit
    await fs.writeFile(path.join(tmpDir, 'README.md'), '# Initial');
    // Ensure .vscode and autopilot files are ignored by git
    await fs.writeFile(path.join(tmpDir, '.gitignore'), '.vscode/\nautopilot.log\n.autopilot.pid\n');
    await runGit(['add', '.'], tmpDir);
    await runGit(['commit', '-m', 'Initial commit'], tmpDir);

    // Prepare noisy files
    await fs.ensureDir(path.join(tmpDir, '.vscode'));
    
    // Spawn watcher in TEST MODE (foreground)
    const watcher = spawn(process.execPath, [BIN_PATH, 'start'], {
      cwd: tmpDir,
      env: { ...process.env, AUTOPILOT_TEST_MODE: '1', AUTOPILOT_TEST_DURATION: '15000' },
      stdio: 'pipe'
    });

    let watcherLog = '';
    let watcherStarted = false;
    
    watcher.stdout.on('data', d => {
      const output = d.toString();
      watcherLog += output;
      if (output.includes('Autopilot is watching')) {
        watcherStarted = true;
      }
    });
    watcher.stderr.on('data', d => watcherLog += d.toString());

    // Wait for watcher to start (max 10s)
    const startTime = Date.now();
    while (!watcherStarted && Date.now() - startTime < 10000) {
      await new Promise(r => setTimeout(r, 100));
    }
    
    if (!watcherStarted) {
      console.error('Watcher failed to start in time. Log:', watcherLog);
      watcher.kill();
      throw new Error('Watcher failed to start');
    }

    // Wait a bit more for chokidar to be fully ready
    await new Promise(r => setTimeout(r, 1000));

    // Make a real change
    await fs.appendFile(path.join(tmpDir, 'README.md'), '\nUpdate 1');

    // Simulate noisy activity
    const noisyInterval = setInterval(async () => {
      try {
        await fs.appendFile(path.join(tmpDir, '.vscode/time-analytics.json'), `{"t": ${Date.now()}}\n`);
        await fs.appendFile(path.join(tmpDir, 'autopilot.log'), `[${new Date().toISOString()}] Log entry\n`);
      } catch (e) { /* ignore */ }
    }, 500);

    // Wait for test mode to finish (it runs for ~15s)
    await new Promise((resolve) => {
      watcher.on('close', resolve);
    });

    clearInterval(noisyInterval);

    // Verify
    const gitLog = await runGit(['log', '--oneline'], tmpDir);
    const commits = gitLog.split('\n');
    
    if (commits.length <= 1) {
      console.error('Watcher Log:', watcherLog);
    }
    
    assert.ok(commits.length > 1, 'Should have created at least one new commit');
    
    const lastCommit = await runGit(['show', '--name-only', 'HEAD'], tmpDir);
    assert.doesNotMatch(lastCommit, /\.vscode/, 'Ignored file should not be in the commit');
    assert.doesNotMatch(lastCommit, /autopilot\.log/, 'Log file should not be in the commit');
    assert.match(lastCommit, /README\.md/, 'Tracked file should be in the commit');
  });

  await t.test('doctor command', async () => {
    const { code } = await run(['doctor'], tmpDir);
    assert.strictEqual(code, 0, 'Doctor should pass in healthy repo');
  });

  await t.test('help command', async () => {
    const { stdout } = await run(['--help'], tmpDir);
    const matches = stdout.match(/Built by Praise Masunga/g);
    assert.strictEqual(matches ? matches.length : 0, 1, 'Signature should appear exactly once');
  });
});
