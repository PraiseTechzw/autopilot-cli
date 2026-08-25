/**
 * Base Integration Class
 */
class Integration {
  constructor(config) {
    this.config = config;
    this.name = 'base';
  }

  async connect() {
    throw new Error('Not implemented');
  }

  async onFocusStart(session) {
    // Optional
  }

  async onFocusEnd(session) {
    // Optional
  }
}

module.exports = Integration;
