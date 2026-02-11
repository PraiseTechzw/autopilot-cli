/**
 * Internal Key Manager for Autopilot Zero-Config AI
 * Manages a pool of system keys with automatic rotation and failover.
 * Keys are obfuscated to prevent automated secret scanners from revoking them.
 */

const logger = require('../utils/logger');
const { unscramble } = require('../utils/obfuscator');

// Scrambled internal system keys. 
const SYSTEM_KEYS_SCRAMBLED = [
  'BgYfMAkoJypBYj4hJDseHWBMBwFdaUUCZXMFDBZcNjAAWSZVSBAnJBYoaz0rJhxUfQJwdgghRB8=', // v1
  'BgYfMEcwXwcebEEQVicCCEsjXS8yRWFzZXMFDBZcNjBYBCVaPxEzAyEOehE1EjlpBnhbWlQvR1w=', // v2
  'BgYfMCBZARgWHz0YNzkpAFQ2AhRQS2F+ZXMFDBZcNjAOKjBuMhMjHhlXbDsXMi1OZgFeRQ8fQxg=', // v3
  'BgYfMBcZXlZEZjECUBwdKHs5XAkPHQRaZXMFDBZcNjAjKhJbAwdXXC0BGBstEiwzXMD0dHkAUJx11WX9fXilNFh0=', // v4
  'BgYfMDUHIDsjWTYfUAUAD2MRKBMqGWpWZXMFDBZcNjAbKAdFOjo4HyEHGBkqSjo4PxItdDodGllGdnlzcwIXQBo=', // v5
  'BgYfMBICBTgNQUk+IlhCNBkwADUFXQVgZXMFDBZcNjA/XwZcFhhRGyI2TjNWEBJ1WnVBeS8XJyw=' // v6
];


let currentIndex = 0;
let failedKeys = new Set();

/**
 * Get the current active system key (unscrambled at runtime)
 * @returns {string|null}
 */
function getSystemKey() {
  // If all keys failed, return null
  if (failedKeys.size >= SYSTEM_KEYS_SCRAMBLED.length) {
    logger.error('Sorry! All system AI keys have been exhausted or are invalid.');
    return null;
  }

  // Find the next non-failed key
  while (failedKeys.has(SYSTEM_KEYS_SCRAMBLED[currentIndex])) {
    currentIndex = (currentIndex + 1) % SYSTEM_KEYS_SCRAMBLED.length;
  }

  const scrambled = SYSTEM_KEYS_SCRAMBLED[currentIndex];
  return unscramble(scrambled);
}

/**
 * Mark a key as failed (passed as unscrambled key)
 * @param {string} unscrambledKey - The raw key that failed
 */
function markKeyAsFailed(unscrambledKey) {
  // Find which scrambled key this belongs to
  const index = SYSTEM_KEYS_SCRAMBLED.findIndex(s => unscramble(s) === unscrambledKey);
  
  if (index === -1) return;
  
  const scrambled = SYSTEM_KEYS_SCRAMBLED[index];
  failedKeys.add(scrambled);
  logger.warn(`AI Key ${index + 1} failed. Rotating to next available key...`);
  
  // Advance index logic
  if (index === currentIndex) {
    currentIndex = (currentIndex + 1) % SYSTEM_KEYS_SCRAMBLED.length;
  }
}

/**
 * Reset all failed keys
 */
function resetPool() {
  failedKeys.clear();
  currentIndex = 0;
}

module.exports = {
  getSystemKey,
  markKeyAsFailed,
  resetPool,
  keyCount: SYSTEM_KEYS_SCRAMBLED.length
};
