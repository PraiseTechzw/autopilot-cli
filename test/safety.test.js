const { describe, it } = require('node:test');
const assert = require('node:assert');
const { findSecretFindings, getBranchPolicy, matchesBranchPattern } = require('../src/core/safety');

describe('Branch policy rules', () => {
  it('should match wildcard branch patterns', () => {
    assert.strictEqual(matchesBranchPattern('release/1.2.3', 'release/*'), true);
    assert.strictEqual(matchesBranchPattern('feature/login', 'release/*'), false);
  });

  it('should resolve branch rules for signing and push policy', () => {
    const policy = getBranchPolicy('release/1.2.3', {
      branchRules: [
        {
          pattern: 'release/*',
          blockPush: true,
          requireChecks: true,
          signCommits: true
        }
      ]
    });

    assert.strictEqual(policy.blockPush, true);
    assert.strictEqual(policy.requireChecks, true);
    assert.strictEqual(policy.signCommits, true);
  });

  it('should not flag regex source code as secrets', () => {
    const source = [
      'const bearer = /Bearer [a-zA-Z0-9\\-\\._~\\+\\/]+=*/;',
      'const privateKey = /-----BEGIN PRIVATE KEY-----/;'
    ].join('\n');

    assert.deepStrictEqual(findSecretFindings(source), []);
  });

  it('should still detect a real bearer token pattern', () => {
    const findings = findSecretFindings('Authorization: Bearer abcdefghijklmnopqrstuvwx123456');
    assert.deepStrictEqual(findings, ['Bearer Token']);
  });
});
