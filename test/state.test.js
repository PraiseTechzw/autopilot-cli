const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const StateManager = require('../src/core/state');

describe('StateManager', () => {
  let tempDir;
  let stateManager;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'autopilot-test-'));
    stateManager = new StateManager(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it('should initialize as running (not paused)', () => {
    assert.strictEqual(stateManager.isPaused(), false);
    assert.deepStrictEqual(stateManager.getState(), { status: 'running', reason: null, pausedAt: null });
  });

  it('should pause with reason', () => {
    stateManager.pause('meeting');
    assert.strictEqual(stateManager.isPaused(), true);
    assert.strictEqual(stateManager.getState().reason, 'meeting');
  });

  it('should resume', () => {
    stateManager.pause('lunch');
    stateManager.resume();
    assert.strictEqual(stateManager.isPaused(), false);
    assert.deepStrictEqual(stateManager.getState(), { status: 'running', reason: null, pausedAt: null });
  });

  it('should persist state across instances', () => {
    stateManager.pause('persisted');
    
    const newManager = new StateManager(tempDir);
    assert.strictEqual(newManager.isPaused(), true);
    assert.strictEqual(newManager.getState().reason, 'persisted');
  });
});
