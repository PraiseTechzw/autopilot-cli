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
    const state = stateManager.getState();
    // Verify core fields of the versioned contract
    assert.strictEqual(state.version, 1);
    assert.strictEqual(state.running, true);
    assert.strictEqual(state.paused, false);
    assert.strictEqual(state.reason, null);
    assert.strictEqual(state.pausedAt, null);
    // 'running' is the backward-compat status value
    assert.strictEqual(state.status, 'running');
  });

  it('should pause with reason', () => {
    stateManager.pause('meeting');
    assert.strictEqual(stateManager.isPaused(), true);
    const state = stateManager.getState();
    assert.strictEqual(state.reason, 'meeting');
    assert.strictEqual(state.status, 'paused');
    assert.strictEqual(state.paused, true);
    assert.strictEqual(state.running, false);
  });

  it('should resume', () => {
    stateManager.pause('lunch');
    stateManager.resume();
    assert.strictEqual(stateManager.isPaused(), false);
    const state = stateManager.getState();
    assert.strictEqual(state.status, 'running');
    assert.strictEqual(state.running, true);
    assert.strictEqual(state.paused, false);
    assert.strictEqual(state.reason, null);
    assert.strictEqual(state.pausedAt, null);
  });

  it('should persist state across instances', () => {
    stateManager.pause('persisted');
    
    const newManager = new StateManager(tempDir);
    assert.strictEqual(newManager.isPaused(), true);
    assert.strictEqual(newManager.getState().reason, 'persisted');
  });
});

