const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');
const { DEFAULT_CONFIG } = require('./defaults');
const { getConfigPath, getConfigDir, ensureConfigDir } = require('../utils/paths');

const getGlobalConfigPath = () => path.join(getConfigDir(), 'config.json');

const loadConfig = async (repoPath) => {
  let config = { ...DEFAULT_CONFIG };

  // 1. Load Global Config
  try {
    const globalPath = getGlobalConfigPath();
    if (await fs.pathExists(globalPath)) {
      const globalConfig = await fs.readJson(globalPath);
      config = { ...config, ...globalConfig };
      logger.debug(`Loaded global config from ${globalPath}`);
    }
  } catch (error) {
    logger.warn(`Error loading global config: ${error.message}`);
  }

  // 2. Load Local Config (Overrides Global)
  const configPath = getConfigPath(repoPath);
  try {
    if (await fs.pathExists(configPath)) {
      const localConfig = await fs.readJson(configPath);
      config = { ...config, ...localConfig };
      logger.debug(`Loaded local config from ${configPath}`);
    }
  } catch (error) {
    logger.warn(`Error loading local config: ${error.message}`);
  }

  // Backward compatibility: map deprecated keys
  try {
    if (config.blockBranches && !config.blockedBranches) {
      config.blockedBranches = config.blockBranches;
    }
  } catch (_) {}

  return config;
};

const saveConfig = async (repoPath, config, isGlobal = false) => {
  try {
    let targetPath;
    if (isGlobal) {
      await ensureConfigDir();
      targetPath = getGlobalConfigPath();
    } else {
      targetPath = getConfigPath(repoPath);
    }

    await fs.writeJson(targetPath, config, { spaces: 2 });
    logger.success(`Config saved to ${targetPath}`);
  } catch (error) {
    logger.error(`Failed to save config: ${error.message}`);
  }
};

const createDefaultConfig = async (repoPath) => {
  const configPath = getConfigPath(repoPath);
  try {
    if (!(await fs.pathExists(configPath))) {
      await fs.writeJson(configPath, DEFAULT_CONFIG, { spaces: 2 });
      logger.success(`Created default config at ${configPath}`);
    }
  } catch (error) {
    logger.error(`Failed to create config: ${error.message}`);
  }
};

module.exports = {
  loadConfig,
  saveConfig,
  createDefaultConfig,
  getGlobalConfigPath
};
