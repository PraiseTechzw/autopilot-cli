const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const { getConfigDir } = require('./paths');
const logger = require('./logger');

const getIdentityPath = () => path.join(getConfigDir(), 'identity.json');

/**
 * Get or create the anonymous user identity
 * @returns {Promise<{id: string, created: number}>} Identity object
 */
async function getIdentity() {
  try {
    const identityPath = getIdentityPath();
    
    if (await fs.pathExists(identityPath)) {
      return await fs.readJson(identityPath);
    }

    // Create new identity
    const identity = {
      id: crypto.randomUUID(),
      created: Date.now()
    };

    await fs.ensureDir(getConfigDir());
    await fs.writeJson(identityPath, identity, { spaces: 2 });
    logger.debug(`Created new anonymous identity: ${identity.id}`);
    
    return identity;
  } catch (error) {
    logger.error(`Failed to manage identity: ${error.message}`);
    // Fallback to memory-only ID if filesystem fails
    return { id: crypto.randomUUID(), created: Date.now() };
  }
}

module.exports = {
  getIdentity
};
