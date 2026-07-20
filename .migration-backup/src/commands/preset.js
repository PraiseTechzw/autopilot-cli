/**
 * Workflow Presets Command
 * Built by Praise Masunga (PraiseTechzw)
 */

const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');
const { getConfigPath } = require('../utils/paths');
const { DEFAULT_CONFIG } = require('../config/defaults');

const PRESETS = {
  'safe-team': {
    description: 'Safe configuration for team collaboration',
    config: {
      teamMode: true,
      pullBeforePush: true,
      conflictStrategy: 'abort',
      preventSecrets: true,
      commitMessageMode: 'smart',
      debounceSeconds: 30,
      minSecondsBetweenCommits: 300
    }
  },
  'solo-speed': {
    description: 'Fast-paced configuration for solo developers',
    config: {
      teamMode: false,
      pullBeforePush: false,
      commitMessageMode: 'simple',
      debounceSeconds: 5,
      minSecondsBetweenCommits: 60,
      autoPush: true
    }
  },
  'strict-ci': {
    description: 'Strict configuration ensuring quality checks pass',
    config: {
      requireChecks: true,
      checks: ['npm test', 'npm run lint'],
      preventSecrets: true,
      preCommitChecks: {
        secrets: true,
        fileSize: true,
        lint: true,
        test: true
      }
    }
  }
};

async function listPresets() {
  logger.section('📋 Available Workflow Presets');
  
  Object.entries(PRESETS).forEach(([name, preset]) => {
    console.log(`\n  ${logger.colors.cyan(name)}`);
    console.log(`    ${preset.description}`);
  });
  console.log('');
}

async function applyPreset(name) {
  if (!name) {
    logger.error('Please specify a preset name.');
    await listPresets();
    return;
  }

  const preset = PRESETS[name];
  if (!preset) {
    logger.error(`Preset '${name}' not found.`);
    await listPresets();
    return;
  }

  const repoPath = process.cwd();
  const configPath = getConfigPath(repoPath);

  try {
    // Read existing config or use defaults
    let currentConfig = DEFAULT_CONFIG;
    if (await fs.pathExists(configPath)) {
      currentConfig = await fs.readJson(configPath);
    }

    // Merge preset config
    const newConfig = {
      ...currentConfig,
      ...preset.config
    };

    await fs.writeJson(configPath, newConfig, { spaces: 2 });
    logger.success(`Applied preset '${name}' successfully!`);
    logger.info(`Updated .autopilotrc.json with ${Object.keys(preset.config).length} settings.`);

  } catch (error) {
    logger.error(`Failed to apply preset: ${error.message}`);
  }
}

async function presetCommand(command, name) {
  switch (command) {
    case 'list':
      await listPresets();
      break;
    case 'apply':
      await applyPreset(name);
      break;
    default:
      // If first arg is a known preset name, treat it as apply
      if (PRESETS[command]) {
        await applyPreset(command);
      } else {
        logger.error(`Unknown command or preset: ${command}`);
        console.log('Usage: autopilot preset [list|apply] <name>');
        console.log('       autopilot preset <name>');
      }
  }
}

module.exports = presetCommand;
