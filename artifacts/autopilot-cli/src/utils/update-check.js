/**
 * Update checker utility
 * Checks for new versions on npm registry
 */

const https = require('https');
const path = require('path');
const fs = require('fs-extra');
const { getConfigDir, ensureConfigDir } = require('./paths');
const pkg = require('../../package.json');

const CHECK_INTERVAL = 1000 * 60 * 60 * 24; // 24 hours
const REGISTRY_URL = 'https://registry.npmjs.org';

/**
 * Fetch latest version from npm registry
 * @param {string} packageName 
 * @returns {Promise<string>}
 */
async function getLatestVersion(packageName) {
  return new Promise((resolve, reject) => {
    const url = `${REGISTRY_URL}/${packageName}/latest`;
    
    const req = https.get(url, {
      timeout: 1500, // Short timeout to avoid hanging
      headers: {
        'User-Agent': `autopilot-cli/${pkg.version}`
      }
    }, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`Status code: ${res.statusCode}`));
      }

      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.version);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

/**
 * Compare two semver strings
 * @param {string} latest 
 * @param {string} current 
 * @returns {boolean} true if latest > current
 */
function isNewer(latest, current) {
  if (!latest || !current) return false;
  
  const l = latest.split(/[\.-]/).map(n => parseInt(n, 10) || 0);
  const c = current.split(/[\.-]/).map(n => parseInt(n, 10) || 0);
  
  // Compare major, minor, patch
  for (let i = 0; i < 3; i++) {
    if (l[i] > c[i]) return true;
    if (l[i] < c[i]) return false;
  }
  return false;
}

function center(text, width) {
  const visibleLen = text.replace(/\x1b\[[0-9;]*m/g, '').length;
  const padding = Math.max(0, width - visibleLen);
  const left = Math.floor(padding / 2);
  const right = padding - left;
  return ' '.repeat(left) + text + ' '.repeat(right);
}

/**
 * Check for updates and notify user
 */
async function checkForUpdate() {
  try {
    await ensureConfigDir();
    const configDir = getConfigDir();
    const cachePath = path.join(configDir, 'update-check.json');
    
    let cache = { lastCheck: 0, latestVersion: null, hasUpdate: false };
    
    try {
      if (await fs.pathExists(cachePath)) {
        cache = await fs.readJson(cachePath);
      }
    } catch (e) {
      // Ignore cache read errors
    }

    const now = Date.now();
    const shouldCheck = !cache.lastCheck || (now - cache.lastCheck > CHECK_INTERVAL);

    if (shouldCheck) {
      try {
        const latestVersion = await getLatestVersion(pkg.name);
        const hasUpdate = isNewer(latestVersion, pkg.version);
        
        cache = {
          lastCheck: now,
          latestVersion,
          hasUpdate
        };
        
        // Save cache without awaiting to not block if FS is slow? 
        // Better to await to ensure it saves.
        await fs.writeJson(cachePath, cache);
      } catch (e) {
        // Failed to check, maybe offline. 
        // Just update lastCheck to avoid retrying immediately on next run? 
        // Or leave it to retry next time. 
        // Let's leave it so we retry next run.
      }
    }

    if (cache.hasUpdate && cache.latestVersion) {
      const v = pkg.version;
      const latest = cache.latestVersion;
      
      // Boxed notification
      console.log('\n');
      console.log('   ╭──────────────────────────────────────────────────╮');
      console.log('   │                                                  │');
      console.log(`   │      Update available ${v.dim()} → ${latest.green()}       │`);
      console.log(`   │      Run ${('npm i -g ' + pkg.name).cyan()} to update      │`);
      console.log('   │                                                  │');
      console.log('   ╰──────────────────────────────────────────────────╯');
      console.log('\n');
    }
  } catch (error) {
    // Fail silently
  }
}

// Add simple color support since we don't have chalk
String.prototype.green = function() { return `\x1b[32m${this}\x1b[0m`; };
String.prototype.cyan = function() { return `\x1b[36m${this}\x1b[0m`; };
String.prototype.dim = function() { return `\x1b[2m${this}\x1b[0m`; };

module.exports = { checkForUpdate };
