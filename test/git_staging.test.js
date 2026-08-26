const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');
const { addAllExcept, hasStagedChanges } = require('../src/core/git');

function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' });
}

test('nested repository staging', async (t) => {
  await t.test('excludes ignored nested repositories without failing', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'autopilot-stage-'));
    try {
      git(root, ['init', '-q']);
      git(root, ['config', 'user.email', 'test@example.com']);
      git(root, ['config', 'user.name', 'Autopilot Test']);
      fs.writeFileSync(path.join(root, '.gitignore'), 'test-repo-sync\n');
      fs.writeFileSync(path.join(root, 'tracked.txt'), 'before\n');
      git(root, ['add', '.']);
      git(root, ['commit', '-qm', 'init']);

      fs.writeFileSync(path.join(root, 'tracked.txt'), 'after\n');
      fs.writeFileSync(path.join(root, 'new.txt'), 'new\n');
      fs.mkdirSync(path.join(root, 'test-repo-sync', '.git'), { recursive: true });
      fs.writeFileSync(path.join(root, 'test-repo-sync', 'nested.txt'), 'must stay out\n');

      const result = await addAllExcept(root, ['test-repo-sync']);
      assert.equal(result.ok, true, result.stderr);
      assert.equal(await hasStagedChanges(root), true);
      const staged = git(root, ['diff', '--cached', '--name-only'])
        .trim()
        .split(/\r?\n/)
        .filter(Boolean)
        .sort();
      assert.deepEqual(staged, ['new.txt', 'tracked.txt']);
      assert.equal(fs.existsSync(path.join(root, 'test-repo-sync', 'nested.txt')), true);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
