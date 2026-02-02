/**
 * Autopilot Insights Command
 * Analyzes logs to provide productivity insights
 */

const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');
const { loadConfig } = require('../config/loader');

async function insights(options) {
  try {
    const repoPath = process.cwd();
    const logFile = path.join(repoPath, 'autopilot.log');

    if (!await fs.pathExists(logFile)) {
      if (options.format === 'json') {
        console.log(JSON.stringify({ error: 'No log found' }));
        return;
      }
      logger.error('No autopilot.log found. Start using autopilot to generate data!');
      return;
    }

    if (options.format !== 'json') {
      logger.info('Analyzing productivity data...');
    }

    const content = await fs.readFile(logFile, 'utf8');
    const lines = content.split('\n').filter(Boolean);
    
    const stats = {
      totalActiveMs: 0,
      files: {},
      sessions: 0
    };

    const today = new Date().toDateString();

    lines.forEach(line => {
      try {
        const entry = JSON.parse(line);
        // Only count today's data for daily summary
        if (new Date(entry.timestamp).toDateString() !== today) return;

        if (entry.type === 'FOCUS_SESSION_START') {
          stats.sessions++;
        }
        
        // This is a simplified aggregation. 
        // Real active time calculation requires reconstructing the timeline.
        // But for now we can look at the latest HEARTBEAT or SWITCH events which contain cumulative data?
        // Actually, FOCUS_HEARTBEAT contains `totalActiveMs` but that's per runtime session, not persisted across restarts.
        // So we need to sum up deltas or look at the structure.
        
        // Since FocusEngine logs structured events, let's just count sessions for now
        // and if we have FOCUS_SWITCH, we can see what files were touched.
        
        if (entry.file) {
             if (!stats.files[entry.file]) stats.files[entry.file] = 0;
             // We don't have exact duration in every log, this is a limitation of the current logging.
             // We need to rely on the "Heartbeat" or "Switch" data.
        }

      } catch (e) {
        // Ignore malformed lines
      }
    });

    // Display Summary
    logger.section('📊 Daily Focus Insights');
    logger.info(`Sessions today: ${stats.sessions}`);
    
    // Suggestion Engine (Task 2)
    logger.section('🧠 Intelligent Suggestions');
    if (stats.sessions > 5) {
      logger.info('High activity detected! Consider taking a longer break.');
    } else if (stats.sessions === 0) {
      logger.info('No deep work sessions recorded today. Pick a complex task and start!');
    }
    
    // Nudges (Task 3 preview)
    // We can check pending time here too if we had git access
    
  } catch (error) {
    logger.error(`Failed to generate insights: ${error.message}`);
  }
}

module.exports = { insights };
