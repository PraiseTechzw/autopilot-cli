/**
 * Simple logger utility for consistent CLI output
 * Built by Praise Masunga (PraiseTechzw)
 */

const logger = {
  colors: {
    cyan: (text) => `\x1b[36m${text}\x1b[0m`,
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    bold: (text) => `\x1b[1m${text}\x1b[0m`
  },

  /**
   * Log informational message
   * @param {string} message - Message to log
   */
  info: (message) => {
    console.log(`${logger.colors.cyan('ℹ️')}  ${message}`);
  },

  /**
   * Log debug message (only visible if DEBUG env var is set)
   * @param {string} message - Message to log
   */
  debug: (message) => {
    if (process.env.DEBUG) {
      console.log(`${logger.colors.blue('🔍')} ${message}`);
    }
  },

  /**
   * Log success message
   * @param {string} message - Message to log
   */
  success: (message) => {
    console.log(`${logger.colors.green('✅')} ${message}`);
  },

  /**
   * Log warning message
   * @param {string} message - Message to log
   */
  warn: (message) => {
    console.warn(`${logger.colors.yellow('⚠️')}  ${message}`);
  },

  /**
   * Log error message
   * @param {string} message - Message to log
   */
  error: (message) => {
    console.error(`${logger.colors.red('❌')} ${message}`);
  },

  /**
   * Log section header
   * @param {string} title - Section title
   */
  section: (title) => {
    console.log(`\n${logger.colors.bold(logger.colors.cyan(title))}`);
    console.log(logger.colors.cyan('─'.repeat(50)));
  },
};

module.exports = logger;
