const { Command } = require('commander');
const { initRepo } = require('./commands/init');
const { startWatcher } = require('./commands/start');
const { stopWatcher } = require('./commands/stop');
const { statusWatcher } = require('./commands/status');
const undoCommand = require('./commands/undo');
const { doctor } = require('./commands/doctor');
const { insights } = require('./commands/insights');
const pauseCommand = require('./commands/pause');
const resumeCommand = require('./commands/resume');
const runDashboard = require('./commands/dashboard');
const pkg = require('../package.json');

function run() {
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
    .action(runDashboard);

  program
    .command('doctor')
    .description('Diagnose and validate autopilot setup')
    .action(doctor);

  program
    .command('insights')
    .description('View productivity insights and focus analytics')
    .option('-f, --format <type>', 'Output format (json, text)', 'text')
    .option('-e, --export <type>', 'Export insights (csv)')
    .action(insights);

  program
    .addHelpText('after', '\nBuilt by Praise Masunga (PraiseTechzw)')
    .addHelpCommand(true, 'Show help for command')
    .showHelpAfterError('(add --help for command information)');

  program.parse(process.argv);
}

module.exports = { run };
