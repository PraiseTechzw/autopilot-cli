const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const HistoryManager = require('../src/core/history');

describe('HistoryManager', () => {
  let tempDir;
  let historyManager;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'autopilot-test-'));
    historyManager = new HistoryManager(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it('should initialize with empty history', () => {
    assert.deepStrictEqual(historyManager.getHistory(), []);
  });

  it('should add a commit', () => {
    const commit = {
      hash: 'abc1234',
      message: 'feat: test commit',
      timestamp: new Date().toISOString()
    };
    historyManager.addCommit(commit);
    
    const history = historyManager.getHistory();
    assert.strictEqual(history.length, 1);
    assert.strictEqual(history[0].hash, 'abc1234');
  });

  it('should get last commit', () => {
    historyManager.addCommit({ hash: '111', message: 'first' });
    historyManager.addCommit({ hash: '222', message: 'second' });
    
    const last = historyManager.getLastCommit();
    assert.strictEqual(last.hash, '222');
  });

  it('should remove last commit', () => {
    historyManager.addCommit({ hash: '111', message: 'first' });
    historyManager.addCommit({ hash: '222', message: 'second' });
    
    const removed = historyManager.removeLastCommit();
    assert.strictEqual(removed.hash, '222');
    assert.strictEqual(historyManager.getLastCommit().hash, '111');
  });

  it('should limit history size (max 100)', () => {
    for (let i = 0; i < 110; i++) {
      historyManager.addCommit({ hash: `${i}`, message: `commit ${i}` });
    }
    
    const history = historyManager.getHistory();
    assert.strictEqual(history.length, 100);
    assert.strictEqual(history[0].hash, '109'); // Newest (unshifted)
  });
});
