/**
 * Config validation for Autopilot
 * Built by Praise Masunga (PraiseTechzw)
 */

const fs = require('fs-extra');
const path = require('path');

/**
 * Validates the current configuration object
 * @param {object} config - The config object to validate
 * @returns {{valid: boolean, errors: string[]}}
 */
function validateConfig(config) {
  const errors = [];

  if (!config) {
    return { valid: false, errors: ['Configuration object is missing'] };
  }

  // Required: watchPath (string, must exist)
  if (typeof config.watchPath !== 'string') {
    errors.push('watchPath must be a string (got ' + typeof config.watchPath + ')');
  } else if (!fs.existsSync(path.resolve(config.watchPath))) {
    errors.push('watchPath: directory does not exist at ' + config.watchPath);
  }

  // Optional: debounceMs or debounceSeconds
  if (config.debounceMs !== undefined) {
    if (typeof config.debounceMs !== 'number') {
      errors.push('debounceMs must be a number (got ' + typeof config.debounceMs + ')');
    } else if (config.debounceMs < 100 || config.debounceMs > 300000) {
      errors.push('debounceMs must be between 100 and 300000 (got ' + config.debounceMs + ')');
    }
  }

  if (config.debounceSeconds !== undefined) {
    if (typeof config.debounceSeconds !== 'number') {
      errors.push('debounceSeconds must be a number (got ' + typeof config.debounceSeconds + ')');
    } else if (config.debounceSeconds < 0.1 || config.debounceSeconds > 300) {
      errors.push('debounceSeconds must be between 0.1 and 300 (got ' + config.debounceSeconds + ')');
    }
  }

  // Optional: aiProvider ("openrouter" | "none")
  const validProviders = ['openrouter', 'none'];
  if (config.aiProvider !== undefined && !validProviders.includes(config.aiProvider)) {
    errors.push('aiProvider must be one of: ' + validProviders.join(', ') + ' (got ' + config.aiProvider + ')');
  }

  // Optional: branch (string or undefined)
  if (config.branch !== undefined && typeof config.branch !== 'string') {
    errors.push('branch must be a string if defined');
  }

  // Optional: protectedBranches (array of strings)
  if (config.protectedBranches !== undefined) {
    if (!Array.isArray(config.protectedBranches)) {
       errors.push('protectedBranches must be an array of strings');
    } else if (config.protectedBranches.some(b => typeof b !== 'string')) {
       errors.push('Every item in protectedBranches must be a string');
    }
  }

  // Optional: allowPushToProtected (boolean)
  if (config.allowPushToProtected !== undefined && typeof config.allowPushToProtected !== 'boolean') {
    errors.push('allowPushToProtected must be a boolean');
  }

  // Optional: notificationsEnabled (boolean)
  if (config.notificationsEnabled !== undefined && typeof config.notificationsEnabled !== 'boolean') {
    errors.push('notificationsEnabled must be a boolean');
  }

  // Optional: offlineMode (boolean)
  if (config.offlineMode !== undefined && typeof config.offlineMode !== 'boolean') {
    errors.push('offlineMode must be a boolean');
  }

  // Optional: signCommits (boolean)
  if (config.signCommits !== undefined && typeof config.signCommits !== 'boolean') {
    errors.push('signCommits must be a boolean');
  }

  // Optional: maxRetryAttempts (number, 1-10)
  if (config.maxRetryAttempts !== undefined) {
    if (typeof config.maxRetryAttempts !== 'number') {
      errors.push('maxRetryAttempts must be a number');
    } else if (config.maxRetryAttempts < 1 || config.maxRetryAttempts > 10) {
      errors.push('maxRetryAttempts must be between 1 and 10');
    }
  }

  // Optional: branchRules (array of branch policy objects)
  if (config.branchRules !== undefined) {
    if (!Array.isArray(config.branchRules)) {
      errors.push('branchRules must be an array');
    } else {
      config.branchRules.forEach((rule, index) => {
        if (!rule || typeof rule !== 'object') {
          errors.push(`branchRules[${index}] must be an object`);
          return;
        }

        if (typeof rule.pattern !== 'string' || !rule.pattern.trim()) {
          errors.push(`branchRules[${index}].pattern must be a non-empty string`);
        }

        if (rule.blockCommit !== undefined && typeof rule.blockCommit !== 'boolean') {
          errors.push(`branchRules[${index}].blockCommit must be a boolean`);
        }

        if (rule.blockPush !== undefined && typeof rule.blockPush !== 'boolean') {
          errors.push(`branchRules[${index}].blockPush must be a boolean`);
        }

        if (rule.allowPush !== undefined && typeof rule.allowPush !== 'boolean') {
          errors.push(`branchRules[${index}].allowPush must be a boolean`);
        }

        if (rule.requireChecks !== undefined && typeof rule.requireChecks !== 'boolean') {
          errors.push(`branchRules[${index}].requireChecks must be a boolean`);
        }

        if (rule.signCommits !== undefined && typeof rule.signCommits !== 'boolean') {
          errors.push(`branchRules[${index}].signCommits must be a boolean`);
        }
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateConfig
};
