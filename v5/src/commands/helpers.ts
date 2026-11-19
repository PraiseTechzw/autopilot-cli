import type { AppError } from "../core/errors.js";
import { jsonFailure, writeErr, writeJson } from "../core/output.js";

export function emitFailure(
  command: string,
  error: AppError,
  json: boolean,
): number {
  if (json) {
    writeJson(jsonFailure(command, error));
  } else {
    writeErr(`autopilot: ${error.message}`);
    if (error.details !== undefined && process.env.AUTOPILOT_DEBUG === "1") {
      writeErr(JSON.stringify(error.details, null, 2));
    }
  }

  return error.exitCode;
}
