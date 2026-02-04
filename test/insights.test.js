const { describe, it, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { insights } = require('../src/commands/insights');
const git = require('../src/core/git');
const logger = require('../src/utils/logger');

describe('Insights Command', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'autopilot-test-'));
    // Silence logger and console
    mock.method(logger, 'info', () => {});
    mock.method(logger, 'warn', () => {});
    mock.method(logger, 'success', () => {});
    mock.method(logger, 'section', () => {});
    mock.method(console, 'log', () => {});
    mock.method(console, 'error', () => {});
  });

  afterEach(async () => {
    await fs.remove(tempDir);
    mock.restoreAll();
  });

  it('should run insights command without error', async () => {
    // Mock git.runGit execution
    mock.method(git, 'runGit', (root, args) => {
        if (args.includes('log')) {
            return Promise.resolve({ 
                ok: true,
                stdout: 'e5b7e2d6f5c8a9b0c1d2e3f4a5b6c7d8e9f0a1b2|author|2023-01-01|feat: test\n1\t1\tfile.js',
                stderr: ''
            });
        }
        return Promise.resolve({ ok: true, stdout: '', stderr: '' });
    });

    // We just want to ensure it runs through
    await insights({ cwd: tempDir });
  });

  it('should export csv if requested', async () => {
    // Mock git.runGit execution
    mock.method(git, 'runGit', (root, args) => {
        if (args.includes('log')) {
            return Promise.resolve({ 
                ok: true,
                stdout: 'e5b7e2d6f5c8a9b0c1d2e3f4a5b6c7d8e9f0a1b2|author|2023-01-01|feat: test\n1\t1\tfile.js',
                stderr: ''
            });
        }
        return Promise.resolve({ ok: true, stdout: '', stderr: '' });
    });

    try {
        await insights({ export: 'csv', cwd: tempDir });
    } catch (error) {
        console.error('Insights error:', error);
    }
    
    // Check if file exists
    // The filename is hardcoded in insights.js as autopilot-insights.csv
    const csvPath = path.join(tempDir, 'autopilot-insights.csv');
    const exists = await fs.pathExists(csvPath);
    assert.strictEqual(exists, true, `CSV file should exist at ${csvPath}`);
  });
});
