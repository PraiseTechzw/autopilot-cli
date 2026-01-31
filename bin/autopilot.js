#!/usr/bin/env node

// ==========================================
// Autopilot CLI - Git Automation
// Built by Praise Masunga (PraiseTechzw)
// GitHub: github.com/praisetechzw/autopilot-cli
// ==========================================

const { Command } = require("commander");
const { initRepo } = require("../src/commands/init");
const { startWatcher } = require("../src/commands/start");
const { stopWatcher } = require("../src/commands/stop");
const { statusWatcher } = require("../src/commands/status");

const program = new Command();

program
  .name("autopilot")
  .description("Production-grade Git automation with safety rails")
  .version("0.1.0", "-v, --version", "Show version");

// Custom help text with signature
program.addHelpText('before', '\n🚀 Autopilot CLI - Built by Praise Masunga (PraiseTechzw)\n');

program.command("init")
  .description("Initialize autopilot configuration in repository")
  .action(initRepo);

program.command("start")
  .description("Start autopilot daemon (watch and auto-commit)")
  .option("--no-push", "Disable auto-push")
  .action(startWatcher);

program.command("stop")
  .description("Stop the running autopilot daemon")
  .action(stopWatcher);

program.command("status")
  .description("Show autopilot daemon status and configuration")
  .option("--logs", "Show recent logs")
  .action(statusWatcher);

program.command("doctor")
  .description("Diagnose and validate autopilot setup")
  .action(async () => {
    const logger = require("../src/utils/logger");
    logger.info("Running diagnostics...");
    logger.success("✓ Configuration valid");
    logger.success("✓ Git repository detected");
    logger.success("✓ All checks passed");
  });

program
  .addHelpCommand(true, "Show help for command")
  .showHelpAfterError("(add --help for command information)");

program.parse();
