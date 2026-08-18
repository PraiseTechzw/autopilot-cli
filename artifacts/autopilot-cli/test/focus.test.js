const { test, describe, it, mock, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs-extra');

describe('Focus Engine', () => {
  let FocusEngine;
  let engine;
  let mockLog = [];
  let currentTime = 1000000;
  
  beforeEach(() => {
    // Reset mocks
    mockLog = [];
    currentTime = 1000000;
    
    // Mock Date.now
    mock.method(Date, 'now', () => currentTime);
    
    // Mock console
    mock.method(console, 'log', () => {});
    mock.method(console, 'warn', (msg) => mockLog.push({ type: 'warn', msg }));
    mock.method(console, 'error', (msg) => mockLog.push({ type: 'error', msg }));
    
    // Mock fs.appendFile
    mock.method(fs, 'appendFile', (file, data) => {
        mockLog.push({ type: 'file', data: JSON.parse(data) });
        return Promise.resolve();
    });

    // Re-require to ensure fresh start if possible, though constructor does most work
    // Note: Node's require cache might persist FocusEngine class, but we create new instance.
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
    
    // First event (time 1000000)
    engine.onFileEvent(file);
    let stats = engine.getStats();
    assert.strictEqual(stats.fileBreakdown[file].activeMs, 0);

    // Second event (time 1000500)
    currentTime += 500;
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
    // Increase active threshold for this test so 1500ms counts as active
    engine.config.activeThresholdSeconds = 2;
    
    // Set threshold low (e.g. 1000ms)
    engine.nudgeThresholdMs = 1000; 
    
    engine.onFileEvent('file.js'); // time 1000000

    // Advance 1500ms (still active since < 2000ms)
    currentTime += 1500;
    engine.onFileEvent('file.js'); // time 10001500

    // Check logs for warning
    const warning = mockLog.find(l => l.type === 'warn' && l.msg.includes('[Nudge]'));
    assert.ok(warning, 'Should log a nudge warning');
    
    // Check file log
    const fileLog = mockLog.find(l => l.type === 'file' && l.data.type === 'FOCUS_NUDGE');
    assert.ok(fileLog, 'Should append FOCUS_NUDGE to log file');
  });

  it('should log session start on long gap', () => {
     engine.onFileEvent('file.js'); // time 1000000

     // Advance 10 seconds (gap > 5s timeout)
     currentTime += 10000;
     engine.onFileEvent('file.js'); // time 1010000

     const sessionLog = mockLog.find(l => l.type === 'file' && l.data.type === 'FOCUS_SESSION_START');
     assert.ok(sessionLog, 'Should log new session start');
  });
});
