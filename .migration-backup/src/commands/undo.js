const logger = require('../utils/logger');
const HistoryManager = require('../core/history');
const git = require('../core/git');

async function undoCommand(options) {
  const root = process.cwd();
  const historyManager = new HistoryManager(root);
  const count = options.count ? parseInt(options.count, 10) : 1;

  if (isNaN(count) || count < 1) {
    logger.error('Invalid count. Must be a positive integer.');
    return;
  }

  logger.info(`Attempting to undo last ${count > 1 ? count + ' commits' : 'commit'}...`);

  // Check for dirty working directory
  const hasChanges = await git.hasChanges(root);
  if (hasChanges) {
    logger.warn('Working directory is dirty. Undo might be unsafe.');
    // In a real interactive CLI, we might ask for confirmation here.
    // For now, we proceed with caution or abort if strictly required.
    // We'll assume soft reset is safe for unpushed, revert for pushed.
  }

  let undoneCount = 0;

  for (let i = 0; i < count; i++) {
    const lastCommit = historyManager.getLastCommit();

    if (!lastCommit) {
      logger.warn('No more Autopilot commits found in history.');
      break;
    }

    // Verify commit exists in git
    const exists = await git.commitExists(root, lastCommit.hash);
    if (!exists) {
      logger.warn(`Commit ${lastCommit.hash} not found in git history. Removing from Autopilot history.`);
      historyManager.removeLastCommit();
      continue;
    }

    // Check if pushed (simplified: if remote branch contains it)
    // For simplicity in this phase, we'll try soft reset first if it's HEAD
    // If it's not HEAD (e.g. manual commits happened on top), we must revert.
    
    const headHash = await git.getLatestCommitHash(root);
    
    if (headHash === lastCommit.hash) {
      // It's the latest commit, we can try soft reset
      logger.info(`Resetting (soft) ${lastCommit.hash} (${lastCommit.message})...`);
      const result = await git.resetSoft(root, 'HEAD~1');
      if (result.ok) {
        historyManager.removeLastCommit();
        undoneCount++;
        logger.success(`Undid ${lastCommit.hash}`);
      } else {
        logger.error(`Failed to reset ${lastCommit.hash}: ${result.stderr}`);
        break; // Stop on error
      }
    } else {
      // It's buried, or pushed (safer to revert in mixed scenarios)
      logger.info(`Reverting ${lastCommit.hash} (${lastCommit.message})...`);
      const result = await git.revert(root, lastCommit.hash);
      if (result.ok) {
        historyManager.removeLastCommit();
        undoneCount++;
        logger.success(`Reverted ${lastCommit.hash}`);
      } else {
        logger.error(`Failed to revert ${lastCommit.hash}: ${result.stderr}`);
        break; // Stop on error
      }
    }
  }

  if (undoneCount > 0) {
    logger.success(`Successfully undid ${undoneCount} commit(s).`);
  } else {
    logger.info('No commits were undone.');
  }
}

module.exports = undoCommand;
