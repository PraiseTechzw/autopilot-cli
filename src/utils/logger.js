const fs = require('fs');
const path = require('path');

const LOG_FILENAME = '.autopilot.log';
const MAX_LOG_SIZE = 500 * 1024; // 500KB
const KEEP_LINES = 200;

let targetPath = null;

const logger = {
  colors: {
    cyan: (text) => `\x1b[36m${text}\x1b[0m`,
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    bold: (text) => `\x1b[1m${text}\x1b[0m`
  },

  setTargetPath: (dir) => {
    targetPath = dir;
  },

  _writeToFile: (message) => {
    if (!targetPath) return; // Only log to file if target path is set
    
    try {
      const logPath = path.join(targetPath, LOG_FILENAME);
      const timestamp = new Date().toISOString();
      const line = `[${timestamp}] ${message}\n`;
      
      // Check size for rotation - only occasionally to avoid heavy I/O
      // We'll trust append for speed and only rotate if we happen to check
      if (Math.random() < 0.05 && fs.existsSync(logPath)) {
        const stats = fs.statSync(logPath);
        if (stats.size > MAX_LOG_SIZE) {
          const content = fs.readFileSync(logPath, 'utf8');
          const lines = content.split('\n');
          const keptLines = lines.slice(-KEEP_LINES).join('\n');
          fs.writeFileSync(logPath, keptLines + '\n');
        }
      }
      
      fs.appendFileSync(logPath, line);
    } catch (err) {
      // Silent fail
    }
  },

  info: (message) => {
    console.log(`${logger.colors.cyan('ℹ️')}  ${message}`);
    logger._writeToFile(`INFO: ${message}`);
  },

  debug: (message) => {
    if (process.env.DEBUG) {
      console.log(`${logger.colors.blue('🔍')} ${message}`);
    }
    logger._writeToFile(`DEBUG: ${message}`);
  },

  success: (message) => {
    console.log(`${logger.colors.green('✅')} ${message}`);
    logger._writeToFile(`SUCCESS: ${message}`);
  },

  warn: (message) => {
    console.warn(`${logger.colors.yellow('⚠️')}  ${message}`);
    logger._writeToFile(`WARN: ${message}`);
  },

  error: (message) => {
    console.error(`${logger.colors.red('❌')} ${message}`);
    logger._writeToFile(`ERROR: ${message}`);
  },

  section: (title) => {
    const sep = '─'.repeat(50);
    console.log(`\n${logger.colors.bold(logger.colors.cyan(title))}`);
    console.log(logger.colors.cyan(sep));
    logger._writeToFile(`SECTION: ${title}`);
  },
};

module.exports = logger;

