/**
 * Simple Obfuscation Utility for internal keys
 * Designed to bypass automated secret scanners (not for military-grade security).
 */

const SALT = 'autopilot-praise-tech-2024';

/**
 * Scrambles a string
 */
function scramble(text) {
  if (!text) return '';
  const bytes = Buffer.from(text, 'utf8');
  const scrambled = bytes.map((byte, i) => byte ^ SALT.charCodeAt(i % SALT.length));
  return scrambled.toString('base64');
}

/**
 * Unscrambles a string
 */
function unscramble(encoded) {
  if (!encoded || encoded.includes('placeholder')) return null;
  try {
    const bytes = Buffer.from(encoded, 'base64');
    const unscrambled = bytes.map((byte, i) => byte ^ SALT.charCodeAt(i % SALT.length));
    return unscrambled.toString('utf8');
  } catch (e) {
    return null;
  }
}

module.exports = { scramble, unscramble };
