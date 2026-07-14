const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs-extra');
const path = require('path');

const { calculateFocusTime, resolveFocusLogPath } = require('../src/commands/leaderboard');

test('Leaderboard focus time', async (t) => {
  const tmpDir = await fs.mkdtemp(path.join(require('os').tmpdir(), 'autopilot-leaderboard-test-'));

  t.after(async () => {
    await fs.remove(tmpDir);
  });

  await t.test('should prefer .autopilot/focus.log and sum session totals', async () => {
    const focusDir = path.join(tmpDir, '.autopilot');
    await fs.ensureDir(focusDir);
    await fs.writeFile(
      path.join(focusDir, 'focus.log'),
      JSON.stringify({ type: 'FOCUS_SESSION_END', totalActiveMs: 120000 }) + '\n'
    );

    const resolved = await resolveFocusLogPath(tmpDir);
    assert.strictEqual(resolved, path.join(focusDir, 'focus.log'));

    const minutes = await calculateFocusTime(tmpDir);
    assert.strictEqual(minutes, 2);
  });
});
