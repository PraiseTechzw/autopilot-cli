const test = require('node:test');
const assert = require('node:assert/strict');

const autopilot = require('../src/index');

test('programmatic API exports a runnable entry point', () => {
  assert.equal(typeof autopilot.run, 'function');
});

test('programmatic API accepts explicit argv', () => {
  assert.doesNotThrow(() => {
    autopilot.run(['node', 'autopilot', 'version']);
  });
});
