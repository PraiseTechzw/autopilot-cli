/**
 * Command: doctor
 * Diagnoses potential issues with the repository and environment
 */

const fs = require('fs-extra');
const path = require('path');
const process = require('process');
const execa = require('execa');
const logger = require('../utils/logger');
const git = require('../core/git');

const doctor = async () => {
  const repoPath = process.cwd();
  let issues = 0;
  
  logger.section('Autopilot Doctor');
  logger.info('Diagnosing environment...');

  // 1. Check Git installation
  try {
    const { stdout } = await execa('git', ['--version']);
    logger.success(`Git installed: ${stdout.trim()}`);
  } catch (error) {
    logger.error('Git is not installed or not in PATH.');
    issues++;
  }

  // 2. Check valid repository
  try {
    const { stdout } = await execa('git', ['rev-parse', '--is-inside-work-tree'], { cwd: repoPath });
    if (stdout.trim() === 'true') {
      logger.success('Valid Git repository detected');
    } else {
      logger.error('Not inside a Git repository.');
      issues++;
      return; // Stop further checks if not a repo
    }
  } catch (error) {
    logger.error('Not inside a Git repository.');
    issues++;
    return;
  }

  // 3. Check remote origin
  try {
    const { stdout } = await execa('git', ['remote', 'get-url', 'origin'], { cwd: repoPath });
    const remoteUrl = stdout.trim();
    logger.success(`Remote 'origin' found: ${remoteUrl}`);

    // Check remote type
    if (remoteUrl.startsWith('http')) {
      logger.warn('Remote uses HTTPS. Ensure credential helper is configured for non-interactive push.');
    } else if (remoteUrl.startsWith('git@') || remoteUrl.startsWith('ssh://')) {
      logger.success('Remote uses SSH (recommended).');
    } else {
      logger.info('Remote uses unknown protocol.');
    }
  } catch (error) {
    logger.warn('No remote \'origin\' configured. Auto-push will fail.');
    issues++;
  }

  // 4. Check branch name
  const branch = await git.getBranch(repoPath);
  if (branch) {
    logger.info(`Current branch: ${branch}`);
    if (branch === 'main' || branch === 'master') {
      logger.warn('You are on the main/master branch. It is recommended to work on feature branches.');
      issues++;
    }
  } else {
    logger.error('Could not detect current branch.');
    issues++;
  }

  // 5. Check .env in .gitignore
  const envPath = path.join(repoPath, '.env');
  if (await fs.pathExists(envPath)) {
    try {
      // Check if ignored by git
      await execa('git', ['check-ignore', '.env'], { cwd: repoPath });
      logger.success('.env is properly ignored.');
    } catch (error) {
      // Exit code 1 means not ignored
      logger.warn('SECURITY WARNING: .env file exists but is NOT ignored by git!');
      logger.info('Add .env to your .gitignore file immediately.');
      issues++;
    }
  }

  // 6. Check remote status (ahead/behind)
  try {
    const remoteStatus = await git.isRemoteAhead(repoPath);
    if (remoteStatus.ok) {
      if (remoteStatus.behind) {
        logger.warn('Your branch is behind remote. You should pull changes before starting autopilot.');
        issues++;
      } else if (remoteStatus.ahead) {
        logger.info('Your branch is ahead of remote. Autopilot will push these changes.');
      } else {
        logger.success('Branch is up to date with remote.');
      }
    } else {
       // Could be no upstream configured, which is fine for local-only initially
       logger.info('Could not check remote status (upstream might not be set).');
    }
  } catch (error) {
    logger.info('Skipping remote status check.');
  }

  // Summary
  console.log(''); // newline
  if (issues === 0) {
    logger.success('Diagnosis complete. No issues found. You are ready to fly! ✈️');
  } else {
    logger.warn(`Diagnosis complete. Found ${issues} potential issue(s).`);
  }
};

module.exports = doctor;
