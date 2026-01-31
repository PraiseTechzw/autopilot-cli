#!/usr/bin/env node

const { Command } = require('commander');
const { initRepo } = require('../src/commands/init');
const { startWatcher } = require('../src/commands/start');
const { stopWatcher } = require('../src/commands/stop');
const { statusWatcher } = require('../src/commands/status');
const { doctor } = require('../src/commands/doctor');
const pkg = require('../package.json');

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
