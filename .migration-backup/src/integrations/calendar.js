/**
 * Calendar Integration (Mock)
 */
const Integration = require('./base');
const logger = require('../utils/logger');

class CalendarIntegration extends Integration {
  constructor(config) {
    super(config);
    this.name = 'calendar';
  }

  async onFocusStart(session) {
    logger.info('📅 Blocking calendar for focus time...');
    // Implementation would go here (e.g. Google Calendar API)
  }

  async onFocusEnd(session) {
    logger.info('📅 Releasing calendar block.');
  }
}

module.exports = CalendarIntegration;
