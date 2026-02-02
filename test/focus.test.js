const { test, describe, it, mock, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs-extra');

// Mock dependencies
// Note: In node:test, mocking modules is tricky without a loader or just overwriting.
// Since we are testing a class that imports logger and fs, we need to be careful.
// A simpler way for unit testing `FocusEngine` is to check its internal state and side effects if we can injection-mock.
// But `FocusEngine` requires `../utils/logger`. 
// We will mock `fs.appendFile` since it's used for logging.

describe('Focus Engine', () => {
  let FocusEngine;
  let engine;
  let mockLog = [];
  
  beforeEach(() => {
    // Reset mocks
    mockLog = [];
    
    // Mock logger
    mock.method(console, 'log', () => {});
    mock.method(console, 'warn', (msg) => mockLog.push({ type: 'warn', msg }));
    mock.method(console, 'error', (msg) => mockLog.push({ type: 'error', msg }));
    
    // Mock fs.appendFile
    mock.method(fs, 'appendFile', (file, data) => {
        mockLog.push({ type: 'file', data: JSON.parse(data) });
        return Promise.resolve();
    });

    FocusEngine = require('../src/core/focus');
    engine = new FocusEngine('/tmp/repo', { 
        focus: { 
            activeThresholdSeconds: 1, // Short for testing
            sessionTimeoutSeconds: 5,
            trackingEnabled: true 
        } 
    });
  });

  afterEach(() => {
    mock.restoreAll();
  });

  it('should track active time for files', () => {
    const file = 'src/test.js';
    
    // First event
    engine.onFileEvent(file);
    let stats = engine.getStats();
    assert.strictEqual(stats.fileBreakdown[file].activeMs, 0);

    // Second event (within threshold)
    // We need to advance time. Since FocusEngine uses Date.now(), we can mock it or just use setTimeout.
    // Mocking Date.now() is cleaner.
    const start = 1000000;
    mock.method(Date, 'now', () => start);
    engine.onFileEvent(file); // Reset lastEvent to start

    mock.method(Date, 'now', () => start + 500); // +500ms
    engine.onFileEvent(file);
    
    stats = engine.getStats();
    assert.strictEqual(stats.fileBreakdown[file].activeMs, 500);
  });

  it('should generate micro-goals for JS files', () => {
    engine.onFileEvent('src/app.js');
    const stats = engine.getStats();
    assert.ok(stats.currentMicroGoals.some(g => g.type === 'test'));
  });

  it('should trigger nudges when pending time exceeds threshold', () => {
    // Set threshold low
    engine.nudgeThresholdMs = 1000; 
    
    const start = 1000000;
    mock.method(Date, 'now', () => start);
    engine.onFileEvent('file.js');

    // Advance 1500ms
    mock.method(Date, 'now', () => start + 1500);
    engine.onFileEvent('file.js');

    // Check logs for warning
    const warning = mockLog.find(l => l.type === 'warn' && l.msg.includes('[Nudge]'));
    assert.ok(warning, 'Should log a nudge warning');
    
    // Check file log
    const fileLog = mockLog.find(l => l.type === 'file' && l.data.type === 'FOCUS_NUDGE');
    assert.ok(fileLog, 'Should append FOCUS_NUDGE to log file');
  });

  it('should log session start on long gap', () => {
     const start = 1000000;
     mock.method(Date, 'now', () => start);
     engine.onFileEvent('file.js');

     // Advance 10 seconds (gap > 5s timeout)
     mock.method(Date, 'now', () => start + 10000);
     engine.onFileEvent('file.js');

     const sessionLog = mockLog.find(l => l.type === 'file' && l.data.type === 'FOCUS_SESSION_START');
     assert.ok(sessionLog, 'Should log new session start');
  });
});
