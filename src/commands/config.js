/**
 * Config Command
 * View and modify Autopilot configuration
 */

const logger = require('../utils/logger');
const { loadConfig, saveConfig, getGlobalConfigPath } = require('../config/loader');
const fs = require('fs-extra');
const { getConfigPath } = require('../utils/paths');

/**
 * Helper to get value by dot notation
 */
const getByDot = (obj, path) => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

/**
 * Helper to set value by dot notation
 */
const setByDot = (obj, path, value) => {
  const parts = path.split('.');
  const last = parts.pop();
  const target = parts.reduce((acc, part) => {
    if (!acc[part]) acc[part] = {};
    return acc[part];
  }, obj);
  target[last] = value;
};

/**
 * Parse value string to appropriate type
 */
const parseValue = (val) => {
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (!isNaN(val) && val.trim() !== '') return Number(val);
  return val;
};

async function config(cmd, key, value, options) {
  const repoPath = options?.cwd || process.cwd();
  const isGlobal = options?.global || false;

  if (cmd === 'list') {
    // If list --global, show only global config?
    // Or just show effective config?
    // Let's show effective config, maybe annotated if we had time.
    // But for now, just loadConfig which merges them.
    const currentConfig = await loadConfig(repoPath);
    console.log(JSON.stringify(currentConfig, null, 2));
    if (isGlobal) {
        logger.info('(Note: Showing effective merged config. Use --global to set global values.)');
    }
    return;
  }

  if (cmd === 'get') {
    if (!key) {
      logger.error('Usage: autopilot config get <key>');
      return;
    }
    // Get always shows effective value
    const currentConfig = await loadConfig(repoPath);
    const val = getByDot(currentConfig, key);
    if (val === undefined) {
      logger.warn(`Key '${key}' not set`);
    } else {
      console.log(typeof val === 'object' ? JSON.stringify(val, null, 2) : val);
    }
    return;
  }

  if (cmd === 'set') {
    if (!key || value === undefined) {
      logger.error('Usage: autopilot config set <key> <value>');
      return;
    }

    const typedValue = parseValue(value);
    
    // We need to read the specific file (local or global) to avoid merging defaults into it
    let rawConfig = {};
    let configPath;

    if (isGlobal) {
        configPath = getGlobalConfigPath();
    } else {
        configPath = getConfigPath(repoPath);
    }
    
    if (await fs.pathExists(configPath)) {
      try {
        rawConfig = await fs.readJson(configPath);
      } catch (e) {
        // Ignore read errors, start fresh
      }
    }
    
    setByDot(rawConfig, key, typedValue);
    
    await saveConfig(repoPath, rawConfig, isGlobal);
    logger.success(`Set ${key} = ${typedValue} ${isGlobal ? '(Global)' : '(Local)'}`);
    return;
  }

  logger.error('Unknown config command. Use list, get, or set.');
}

module.exports = config;
