/**
 * System notifications for Autopilot events
 * Built by Praise Masunga (PraiseTechzw)
 */

const notifier = require('node-notifier');
const path = require('path');

/**
 * Send a desktop notification
 * @param {string} event - The name/type of the event
 * @param {object} data - The event data { message, branch, title, sound }
 * @param {boolean} [enabled=true] - Whether notifications are enabled in config
 */
function notify(event, data, enabled = true) {
  if (!enabled) return;

  try {
    let title = data.title || 'Autopilot';
    let message = data.message || '';
    let sound = data.sound || false;

    switch (event) {
      case 'push_success':
        title = 'Autopilot';
        message = `Pushed: ${data.commitMessage || 'latest changes'}`;
        sound = false;
        break;
      case 'push_failed':
        title = 'Autopilot';
        message = 'Push failed — queued for retry';
        sound = false;
        break;
      case 'conflict':
        title = 'Autopilot — Action needed';
        message = `Merge conflict in ${data.branch || 'current branch'} — paused`;
        sound = true;
        break;
      case 'queue_cleared':
        title = 'Autopilot';
        message = 'All queued pushes succeeded';
        sound = false;
        break;
    }

    notifier.notify({
      title,
      message,
      sound,
      // Optional icon (use relative from src/core to some generic icon location if it exists)
      // icon: path.join(__dirname, '../assets/icon.png')
    });
  } catch (error) {
    // Never crash the watcher if notifications fail
    // console.error('Notification failed:', error);
  }
}

module.exports = {
  notify
};
