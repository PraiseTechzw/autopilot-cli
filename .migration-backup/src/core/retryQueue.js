/**
 * Network retry queue for failed pushes
 * Built by Praise Masunga (PraiseTechzw)
 */

const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

class RetryQueue {
  /**
   * Initialize retry queue
   * @param {string} root - Repository root path
   * @param {Function} pushFn - Function to call for retry (expects root, branch)
   */
  constructor(root, pushFn) {
    this.root = root;
    this.queuePath = path.join(root, '.autopilot-queue.json');
    this.pushFn = pushFn;
    this.queue = [];
    this.retryDelays = [30000, 60000, 120000, 300000, 600000]; // 30s, 60s, 2m, 5m, 10m
    
    this.load();
    this.initRetries();
  }

  /**
   * Load existing queue from file
   */
  load() {
    try {
      if (fs.existsSync(this.queuePath)) {
        this.queue = fs.readJsonSync(this.queuePath);
        // Reset timers/attempts if loaded from disk?
        // Actually we should resume where it left off, but we'll re-init timers.
      }
    } catch (err) {
      logger.error('Failed to load retry queue:', err.message);
      this.queue = [];
    }
  }

  /**
   * Persist current queue to file
   */
  save() {
    try {
      fs.writeJsonSync(this.queuePath, this.queue, { spaces: 2 });
    } catch (err) {
      logger.error('Failed to save retry queue:', err.message);
    }
  }

  /**
   * Add a new push job to the queue
   * @param {object} job - { commitHash, branch, timestamp, attempts, maxAttempts }
   */
  add(job) {
    const newJob = {
      ...job,
      timestamp: Date.now(),
      attempts: job.attempts || 0,
      maxAttempts: job.maxAttempts || 5
    };
    
    // Check if duplicate?
    if (this.queue.some(j => j.commitHash === job.commitHash)) {
       return;
    }

    this.queue.push(newJob);
    this.save();
    
    // Start retry for this job
    this.scheduleRetry(newJob);
    logger.info(`Push queued — will retry later (Job: ${newJob.commitHash})`);
  }

  /**
   * Cancel a pending job
   * @param {string} commitHash 
   */
  cancel(commitHash) {
    this.queue = this.queue.filter(j => j.commitHash !== commitHash);
    this.save();
  }

  /**
   * Schedule a retry for a specific job
   * @param {object} job 
   */
  scheduleRetry(job) {
    const delay = this.retryDelays[job.attempts] || 600000;
    
    setTimeout(async () => {
      // Re-fetch job from queue to see if it hasn't been cancelled or already succeeded
      const currentJob = this.queue.find(j => j.commitHash === job.commitHash);
      if (!currentJob) return;

      currentJob.attempts++;
      logger.info(`Retrying queued push (Attempt ${currentJob.attempts}/${currentJob.maxAttempts}) for ${currentJob.commitHash}`);

      try {
        const result = await this.pushFn(this.root, currentJob.branch);
        if (result.ok) {
          logger.info(`Queued push succeeded on attempt ${currentJob.attempts} for ${currentJob.commitHash}`);
          this.cancel(currentJob.commitHash);
          if (this.queue.length === 0) {
            // Emit queue cleared event
          }
        } else {
          if (currentJob.attempts >= currentJob.maxAttempts) {
            logger.error(`Max retry attempts exceeded for ${currentJob.commitHash}. Job removed from queue.`);
            this.cancel(currentJob.commitHash);
          } else {
            this.save(); // Update attempt count on disk
            this.scheduleRetry(currentJob); // Continue backoff
          }
        }
      } catch (error) {
        logger.error(`Retry error for ${currentJob.commitHash}: ${error.message}`);
        this.scheduleRetry(currentJob);
      }
    }, delay);
  }

  /**
   * Initialize retries for all pending jobs in the queue (e.g. after restart)
   */
  initRetries() {
    if (this.queue.length > 0) {
      logger.info(`Resuming ${this.queue.length} pending push jobs from queue...`);
      this.queue.forEach(job => this.scheduleRetry(job));
    }
  }

  /**
   * Get public status of the queue
   * @returns {Array}
   */
  getStatus() {
    return this.queue.map(j => ({
       commitHash: j.commitHash,
       branch: j.branch,
       attempts: j.attempts,
       maxAttempts: j.maxAttempts,
       queuedAt: new Date(j.timestamp).toISOString()
    }));
  }
}

module.exports = RetryQueue;
