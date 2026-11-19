#!/usr/bin/env node

import { Command, CommanderError } from "commander";
import { configValidateCommand } from "./commands/config-validate.js";
import { doctorCommand } from "./commands/doctor.js";
import { emitFailure } from "./commands/helpers.js";
import { statusCommand } from "./commands/status.js";
import { versionCommand } from "./commands/version.js";
import { AppError, toAppError } from "./core/errors.js";
import { jsonFailure, writeErr, writeJson } from "./core/output.js";

function wantsJson(argv: readonly string[]): boolean {
  return argv.includes("--json");
}

function addJsonOption(command: Command): Command {
  return command.option("--json", "output one JSON document on stdout");
}

async function main(argv: readonly string[]): Promise<void> {
  const program = new Command();

  program
    .name("autopilot-v5")
    .description("Safe, local-first Git automation")
    .showHelpAfterError()
    .exitOverride();

  addJsonOption(program);

  addJsonOption(program.command("version").description("print version information"))
    .action((_options: Record<string, unknown>, command: Command) => {
      const json = Boolean(command.optsWithGlobals().json);
      process.exitCode = versionCommand(json);
    });

  addJsonOption(
    program.command("doctor").description("check the local environment and config"),
  ).action(async (_options: Record<string, unknown>, command: Command) => {
    const json = Boolean(command.optsWithGlobals().json);
    process.exitCode = await doctorCommand(json);
  });

  addJsonOption(
    program.command("status").description("show repository and configuration status"),
  ).action(async (_options: Record<string, unknown>, command: Command) => {
    const json = Boolean(command.optsWithGlobals().json);
    process.exitCode = await statusCommand(json);
  });

  const config = program
    .command("config")
    .description("inspect and validate configuration");

  addJsonOption(
    config.command("validate").description("validate .autopilotrc.json"),
  ).action((_options: Record<string, unknown>, command: Command) => {
    const json = Boolean(command.optsWithGlobals().json);
    process.exitCode = configValidateCommand(json);
  });

  try {
    await program.parseAsync([...argv]);
  } catch (error) {
    if (error instanceof CommanderError) {
      if (error.exitCode === 0) {
        return;
      }

      if (wantsJson(argv)) {
        writeJson(
          jsonFailure(
            "cli",
            new AppError("USAGE", error.message, { exitCode: error.exitCode }),
          ),
        );
      } else {
        writeErr(error.message);
      }

      process.exitCode = error.exitCode;
      return;
    }

    const appError = toAppError(error, "Unexpected failure");
    process.exitCode = emitFailure("cli", appError, wantsJson(argv));
  }
}

void main(process.argv).catch((error: unknown) => {
  const appError = toAppError(error, "Unexpected failure");
  process.exitCode = emitFailure("cli", appError, wantsJson(process.argv));
});
