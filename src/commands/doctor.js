const fs = require('fs-extra');
const path = require('path');
const { execa } = require('execa');
const logger = require('../utils/logger');
const git = require('../core/git');
const { getGitPath } = require('../utils/paths');

async function doctor() {
  const repoPath = process.cwd();

  logger.section('Autopilot Doctor');

  // Check git installed
  try {
    const result = await execa('git', ['--version'], { reject: false });
    if (result.exitCode === 0) {
      logger.success(`Git installed (${result.stdout.trim()})`);
    } else {
      logger.error('Git not available. Install Git and try again.');
      return;
    }
  } catch (error) {
    logger.error('Git not available. Install Git and try again.');
    return;
  }

  // Check repository
  const gitPath = getGitPath(repoPath);
  if (await fs.pathExists(gitPath)) {
    logger.success('Git repository detected');
  } else {
    logger.error('Not a git repository. Run this inside a git repo.');
    return;
  }

  // Check origin remote
  let originUrl = '';
  try {
    const result = await execa('git', ['remote', 'get-url', 'origin'], {
      cwd: repoPath,
      reject: false,
    });
    if (result.exitCode === 0) {
      originUrl = result.stdout.trim();
      logger.success(`Origin remote: ${originUrl}`);
    } else {
      logger.warn('Origin remote not found. Add one with: git remote add origin <url>');
    }
  } catch (error) {
    logger.warn('Origin remote not found. Add one with: git remote add origin <url>');
  }

  // Auth method
  if (originUrl) {
    if (originUrl.startsWith('git@') || originUrl.startsWith('ssh://')) {
      logger.info('Auth method: SSH');
    } else if (originUrl.startsWith('https://')) {
      logger.info('Auth method: HTTPS');
    } else {
      logger.info('Auth method: Unknown');
    }
  }

  // Branch warning
  const branch = await git.getBranch(repoPath);
  if (branch) {
    if (branch === 'main' || branch === 'master') {
      logger.warn(`You are on ${branch}. Consider using a feature branch.`);
    } else {
      logger.success(`Current branch: ${branch}`);
    }
  } else {
    logger.warn('Unable to determine current branch.');
  }

  // .env in gitignore
  const gitignorePath = path.join(repoPath, '.gitignore');
  if (await fs.pathExists(gitignorePath)) {
    const content = await fs.readFile(gitignorePath, 'utf-8');
    const lines = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'));

    const ignoresEnv = lines.some((line) => {
      if (line === '.env') return true;
      if (line === '.env*') return true;
      if (line.startsWith('.env.')) return true;
      return false;
    });

    if (ignoresEnv) {
      logger.success('.env appears to be ignored in .gitignore');
    } else {
      logger.warn('.env is not ignored in .gitignore');
    }
  } else {
    logger.warn('No .gitignore found. Consider adding one to protect secrets.');
  }
}

module.exports = { doctor };
