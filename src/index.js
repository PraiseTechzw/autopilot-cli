const { Command } = require('commander');
const { initRepo } = require('./commands/init');
const { startWatcher } = require('./commands/start');
const { stopWatcher } = require('./commands/stop');
const { statusWatcher } = require('./commands/status');
const { doctor } = require('./commands/doctor');
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
    .command('doctor')
    .description('Diagnose and validate autopilot setup')
    .action(doctor);

  program
    .addHelpText('after', '\nBuilt by Praise Masunga (PraiseTechzw)')
    .addHelpCommand(true, 'Show help for command')
    .showHelpAfterError('(add --help for command information)');

  program.parse(process.argv);
}

module.exports = { run };
