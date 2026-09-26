import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCliArgs, classifyError, parseJson, versionAtLeast } from '../src/protocol';

test('builds safe structured CLI arguments without shell interpolation', () => {
  assert.deepEqual(buildCliArgs(['review', '--staged'], true, true), ['review', '--staged', '--json', '--ai']);
  assert.deepEqual(buildCliArgs(['execute-task', 'fix login; echo unsafe'], false, false), ['execute-task', 'fix login; echo unsafe']);
});

test('parses structured JSON and reports malformed responses', () => {
  assert.deepEqual(parseJson<{ passed: boolean }>('{"passed":true}', 'verify'), { passed: true });
  assert.throws(() => parseJson('{broken', 'verify'), /invalid JSON/);
});

test('checks CLI compatibility across patch and major versions', () => {
  assert.equal(versionAtLeast('1.0.0', '1.0.0'), true);
  assert.equal(versionAtLeast('1.0.3', '1.0.0'), true);
  assert.equal(versionAtLeast('0.9.9', '1.0.0'), false);
  assert.equal(versionAtLeast('2.0.0', '1.0.0'), true);
});

test('maps common CLI failures to actionable categories', () => {
  assert.equal(classifyError('set GITHUB_TOKEN before using GitHub commands'), 'auth');
  assert.equal(classifyError('AI provider unavailable: OPENROUTER_API_KEY'), 'provider');
  assert.equal(classifyError('not a Git repository'), 'git');
  assert.equal(classifyError('unexpected failure'), 'command');
});
