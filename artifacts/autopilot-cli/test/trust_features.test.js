const assert = require('assert');
const path = require('path');
const fs = require('fs-extra');
const { describe, it, beforeEach, afterEach } = require('node:test');
const { addTrailers } = require('../src/core/commit');
const { getIdentity } = require('../src/utils/identity');
const eventSystem = require('../src/core/events');
const { generateSignature } = require('../src/utils/crypto');

const tmpDir = path.join(__dirname, 'tmp-trust');
const configDir = path.join(tmpDir, '.autopilot');

describe('Trust & Safety Features', () => {
  beforeEach(async () => {
    await fs.ensureDir(tmpDir);
    process.env.AUTOPILOT_CONFIG_DIR = configDir; // Mock config dir if possible, or we mock paths
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
    delete process.env.AUTOPILOT_CONFIG_DIR;
  });

  it('should generate a persistent anonymous identity', async () => {
    // 1. First call creates it
    const id1 = await getIdentity();
    assert.ok(id1.id);
    assert.ok(id1.created);
    
    // 2. Second call reads it
    const id2 = await getIdentity();
    assert.strictEqual(id1.id, id2.id);
    
    // 3. Verify file exists
    const idPath = path.join(configDir, 'identity.json');
    assert.ok(await fs.pathExists(idPath));
  });

  it('should append Autopilot trailers to commit message', async () => {
    const message = 'feat: test commit';
    const signedMessage = await addTrailers(message);
    
    assert.ok(signedMessage.includes('Autopilot-Commit: true'));
    assert.ok(signedMessage.includes('Autopilot-Version:'));
    assert.ok(signedMessage.includes('Autopilot-User:'));
    assert.ok(signedMessage.includes('Autopilot-Signature:'));
  });

  it('should generate valid HMAC signature', async () => {
    const content = 'test';
    const secret = 'secret';
    const sig = generateSignature(content, secret);
    assert.strictEqual(sig.length, 64); // SHA256 hex is 64 chars
  });
});
