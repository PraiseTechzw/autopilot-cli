#!/usr/bin/env node

const { Command } = require('commander');
const initRepo = require('../src/commands/init');
const startWatcher = require('../src/commands/start');
const stopWatcher = require('../src/commands/stop');
const statusWatcher = require('../src/commands/status');
const undoCommand = require('../src/commands/undo');
const pauseCommand = require('../src/commands/pause');
const resumeCommand = require('../src/commands/resume');
const { insights } = require('../src/commands/insights');
const { leaderboard } = require('../src/commands/leaderboard');
const doctor = require('../src/commands/doctor');
const presetCommand = require('../src/commands/preset');
const configCommand = require('../src/commands/config');
const interactiveCommand = require('../src/commands/interactive');
const pkg = require('../package.json');
const logger = require('../src/utils/logger');
const { checkForUpdate } = require('../src/utils/update-check');

// Validate command handlers
const commands = {
  init: initRepo,
  start: startWatcher,
  stop: stopWatcher,
  status: statusWatcher,
  undo: undoCommand,
  pause: pauseCommand,
  resume: resumeCommand,
  insights: insights,
  leaderboard: leaderboard,
  doctor: doctor,
  preset: presetCommand,
  config: configCommand,
  interactive: interactiveCommand
};

// Runtime assertion to prevent wiring errors
Object.entries(commands).forEach(([name, handler]) => {
  if (typeof handler !== 'function') {
    console.error(`\n❌ FATAL ERROR: Command handler for '${name}' is not a function.`);
    console.error(`Received: ${typeof handler}`);
    console.error('Please report this issue to the maintainer.\n');
    process.exit(1);
  }
});

const program = new Command();

program
  .name('autopilot')
  .description('Git automation with safety rails')
  .version(pkg.version, '-v, --version', 'Show version');

program
  .command('init')
  .description('Initialize autopilot configuration in repository')
  .action(initRepo);

program
  .command('start')
  .description('Start autopilot watcher in foreground')
  .action(startWatcher);

program
  .command('stop')
  .description('Stop the running autopilot watcher')
  .action(stopWatcher);

program
  .command('status')
  .description('Show autopilot watcher status')
  .action(statusWatcher);

program
  .command('undo')
  .description('Undo the last Autopilot commit')
  .option('-c, --count <n>', 'Number of commits to undo', '1')
  .action(undoCommand);

program
  .command('pause [reason]')
  .description('Pause Autopilot watcher')
  .action(pauseCommand);

program
  .command('resume')
  .description('Resume Autopilot watcher')
  .action(resumeCommand);

program
  .command('dashboard')
  .description('View real-time Autopilot dashboard')
  .action(async () => {
    try {
      const { default: runDashboard } = await import('../src/commands/dashboard.mjs');
      runDashboard();
    } catch (error) {
      console.error('Failed to launch dashboard:', error);
    }
  });

program
  .command('insights')
  .description('View productivity insights and focus analytics')
  .option('-f, --format <type>', 'Output format (json, text)', 'text')
  .option('-e, --export <type>', 'Export insights (csv)')
  .action(insights);

program
  .command('leaderboard')
  .description('View or sync with the global leaderboard')
  .option('--sync', 'Sync your local stats to the leaderboard')
  .action(leaderboard);

program
  .command('preset [action] [name]')
  .description('Manage workflow presets (list, apply)')
  .action(presetCommand);

program
  .command('config [action] [key] [value]')
  .description('Manage configuration (list, get, set)')
  .option('-g, --global', 'Use global configuration')
  .action(configCommand);

program
  .command('interactive [on|off]')
  .description('Toggle AI Safety Mode (on = prompt, off = automated)')
  .option('-g, --global', 'Set the preference globally')
  .action(interactiveCommand);

program
  .command('doctor')
  .description('Diagnose and validate autopilot setup')
  .action(doctor);

program
  .addHelpText('after', '\nBuilt by Praise Masunga (PraiseTechzw)')
  .addHelpCommand(true, 'Show help for command')
  .showHelpAfterError('(add --help for command information)');

(async () => {
  await checkForUpdate();
  program.parse(process.argv);
})();
