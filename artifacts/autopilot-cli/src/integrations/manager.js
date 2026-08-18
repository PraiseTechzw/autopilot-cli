/**
 * Integration Manager
 * Handles communication with external tools
 */

const logger = require('../utils/logger');

class IntegrationManager {
  constructor(config) {
    this.config = config || {};
    this.integrations = [];
    this.active = false;
  }

  register(integration) {
    this.integrations.push(integration);
  }

  async notifyFocusStart(file) {
    if (!this.config.integrationsEnabled) return;
    
    logger.debug('[Integrations] Notifying focus start...');
    this.active = true;
    
    await Promise.all(this.integrations.map(async (integration) => {
      try {
        await integration.onFocusStart({ file, startTime: Date.now() });
      } catch (err) {
        logger.warn(`Integration ${integration.name} failed: ${err.message}`);
      }
    }));
  }

  async notifyFocusEnd() {
    if (!this.active) return;
    this.active = false;
    
    await Promise.all(this.integrations.map(async (integration) => {
      try {
        await integration.onFocusEnd({ endTime: Date.now() });
      } catch (err) {
        logger.warn(`Integration ${integration.name} failed: ${err.message}`);
      }
    }));
  }
}

module.exports = IntegrationManager;
