/**
 * Removed in 5.0.
 *
 * 4.x shipped an obfuscated pool of provider credentials in this module.
 * Those credentials are treated as compromised and must be revoked.
 * 5.0 never bundles provider keys; AI is opt-in and reads a key from the
 * environment or the OS keychain through the provider boundary.
 *
 * This stub keeps legacy imports from loading secret material. It does not
 * provide a key.
 */

const keyCount = 0;

function getSystemKey() {
  return null;
}

function markKeyAsFailed() {}

function resetPool() {}

module.exports = {
  getSystemKey,
  markKeyAsFailed,
  resetPool,
  keyCount,
};
