/**
 * Rule-based commit message generator fallback
 * Built by Praise Masunga (PraiseTechzw)
 */

const path = require('path');

/**
 * Generate a rule-based commit message from staged files
 * @param {Array<{status: string, file: string}>} stagedFiles - Array of staged files with status and path
 * @returns {string} - Formatted commit message
 */
function generateRuleBasedMessage(stagedFiles) {
  if (!stagedFiles || stagedFiles.length === 0) {
    return 'update: minor changes';
  }

  const numFiles = stagedFiles.length;
  
  // Single file changed logic
  if (numFiles === 1) {
    const { status, file } = stagedFiles[0];
    const filename = path.basename(file);
    const ext = path.extname(file).toLowerCase();
    
    // Apply prefix detection
    const prefix = getPrefix(file);

    if (status === 'A' || status === 'A ') {
      return `add: ${filename}`;
    }
    if (status === 'D' || status === ' D') {
      return `remove: ${filename}`;
    }
    if (status === 'R' || status === ' R') {
      return `rename: ${file.includes(' -> ') ? file : filename}`;
    }

    // Specialized logic for modified files
    if (ext === '.js' || ext === '.ts' || ext === '.jsx' || ext === '.tsx') {
      if (filename.includes('.test.') || filename.includes('.spec.')) return `test: update tests in ${filename}`;
      if (filename.includes('route')) return `feat(api): update route ${filename}`;
      if (filename.includes('controller')) return `feat(api): update controller ${filename}`;
      if (filename.includes('service')) return `feat: update service ${filename}`;
    }
    
    if (ext === '.md') return `docs: update ${filename}`;
    if (filename === 'package.json') return `chore: update dependencies`;
    if (ext === '.env' || ext === '.config' || filename.includes('config')) return `config: update ${filename}`;

    return `${prefix} modify ${filename}`;
  }

  // Multiple files changed logic
  const allExtensions = new Set(stagedFiles.map(f => path.extname(f.file).toLowerCase()));
  const allDirs = new Set(stagedFiles.map(f => path.dirname(f.file)));
  const topLevelDirs = new Set(stagedFiles.map(f => f.file.split(/[/\\]/)[0]));
  
  const allAdded = stagedFiles.every(f => f.status === 'A' || f.status === 'A ');
  const allDeleted = stagedFiles.every(f => f.status === 'D' || f.status === ' D');
  const mixedStatus = stagedFiles.some(f => f.status === 'A' || f.status === 'A ') && 
                     stagedFiles.some(f => f.status === 'D' || f.status === ' D');

  if (allAdded) return `add: ${numFiles} new files`;
  if (allDeleted) return `remove: ${numFiles} files`;
  if (mixedStatus) return `refactor: restructure ${numFiles} files`;

  // All in same sub-folder
  if (allDirs.size === 1 && Array.from(allDirs)[0] !== '.') {
    const folderPath = Array.from(allDirs)[0];
    const folderName = path.basename(folderPath);
    const prefix = getPrefix(folderPath);
    // Remove ':' from prefix if it's there to avoid double ':'
    const cleanPrefix = prefix.endsWith(':') ? prefix.slice(0, -1) : prefix;
    return `${cleanPrefix}: updates in ${folderName}/`;
  }

  // All same type of file
  if (allExtensions.size === 1) {
    const ext = Array.from(allExtensions)[0].replace('.', '') || 'files';
    const prefix = getPrefix(stagedFiles[0].file);
    const cleanPrefix = prefix.endsWith(':') ? prefix.slice(0, -1) : prefix;
    return `${cleanPrefix}: modify ${numFiles} ${ext} files`;
  }

  // Top level directory grouping
  if (topLevelDirs.size === 1 && Array.from(topLevelDirs)[0] !== '.') {
    const dir = Array.from(topLevelDirs)[0];
    return `update: changes in ${dir} module`;
  }

  // Mixed files across dirs
  const dirs = Array.from(topLevelDirs).filter(d => d !== '.' && !d.includes('.'));
  if (dirs.length > 0) {
    return `update: ${numFiles} files across ${dirs.slice(0, 2).join(', ')}${dirs.length > 2 ? '...' : ''}`;
  }

  return `update: ${numFiles} files`;
}

/**
 * Get prefix based on file path
 * @param {string} filePath 
 * @returns {string}
 */
function getPrefix(filePath) {
  const file = filePath.toLowerCase().replace(/\\/g, '/');
  
  // Specific domains
  if (file.includes('/auth/')) return 'feat(auth):';
  if (file.includes('/api/')) return 'feat(api):';
  if (file.includes('/cli/')) return 'feat(cli):';
  if (file.includes('/db/') || file.includes('prisma') || file.includes('migration')) return 'feat(db):';
  if (file.includes('/ui/') || file.includes('components/') || file.includes('styles/')) return 'feat(ui):';
  if (file.includes('/hooks/')) return 'feat(hooks):';
  
  // Categories
  if (file.includes('test/') || file.includes('.test.') || file.includes('.spec.')) return 'test:';
  if (file.includes('docs/') || file.endsWith('.md')) return 'docs:';
  if (file.endsWith('package.json') || file.endsWith('.npmrc') || file.endsWith('lock')) return 'chore:';
  if (file.includes('.github/') || file.includes('/ci/')) return 'ci:';
  if (file.includes('fix/') || file.includes('bug')) return 'fix:';
  if (file.includes('refactor/')) return 'refactor:';
  
  return 'update:';
}

module.exports = {
  generateRuleBasedMessage
};
