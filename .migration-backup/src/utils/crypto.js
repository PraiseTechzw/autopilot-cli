const crypto = require('crypto');

/**
 * Generate HMAC signature for commit verification
 * @param {string} content - Content to sign (message + timestamp + version)
 * @param {string} secret - Secret key (using anonymous ID as salt for now)
 * @returns {string} HMAC SHA256 signature
 */
function generateSignature(content, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(content)
    .digest('hex');
}

module.exports = {
  generateSignature
};
