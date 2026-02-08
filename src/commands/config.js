/**
 * Config Command
 * View and modify Autopilot configuration
 */

const logger = require('../utils/logger');
const { loadConfig, saveConfig } = require('../config/loader');

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

async function config(cmd, key, value) {
  const repoPath = process.cwd();
  
  // Reload fresh config (don't rely on defaults merged yet if we want to see raw?)
  // Actually loadConfig returns merged defaults.
  // For 'set', we might want to read the raw file to avoid writing defaults into it?
  // But saveConfig overwrites the whole file. 
  // Let's rely on loadConfig which returns the effective config. 
  // Wait, if we save the result of loadConfig, we might save all defaults into the user's config file.
  // This is acceptable behavior for 'git config' style tools often, 
  // but cleaner to only save what's changed.
  // Let's just use loadConfig/saveConfig as implemented for now. 
  // Users can inspect .autopilotrc manually if they want minimal diffs.
  
  let currentConfig = await loadConfig(repoPath);

  if (cmd === 'list') {
    console.log(JSON.stringify(currentConfig, null, 2));
    return;
  }

  if (cmd === 'get') {
    if (!key) {
      logger.error('Usage: autopilot config get <key>');
      return;
    }
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
    
    // We need to be careful not to save the FULL merged config with defaults 
    // back to disk if we can avoid it, but our current loader architecture 
    // merges them. 
    // Ideally we should read the RAW config file, update that, and save.
    // Let's import fs to read raw.
    const fs = require('fs-extra');
    const { getConfigPath } = require('../utils/paths');
    const configPath = getConfigPath(repoPath);
    
    let rawConfig = {};
    if (await fs.pathExists(configPath)) {
      rawConfig = await fs.readJson(configPath);
    }
    
    setByDot(rawConfig, key, typedValue);
    
    await saveConfig(repoPath, rawConfig);
    logger.success(`Set ${key} = ${typedValue}`);
    return;
  }

  logger.error('Unknown config command. Use list, get, or set.');
}

module.exports = config;
