import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { AppError } from "../errors.js";
import { err, ok, type Result } from "../result.js";
import {
  CONFIG_VERSION,
  ConfigSchema,
  defaultConfig,
  type Config,
} from "./schema.js";

export const CONFIG_FILENAME = ".autopilotrc.json";
const MAX_CONFIG_BYTES = 1_048_576;

export interface LoadedConfig {
  readonly config: Config;
  readonly path: string | null;
  readonly source: "defaults" | "file";
}

function invalidConfig(message: string, details: Record<string, unknown>): AppError {
  return new AppError("CONFIG_INVALID", message, {
    exitCode: 1,
    details,
  });
}

export function loadConfig(
  cwd: string = process.cwd(),
): Result<LoadedConfig, AppError> {
  const configPath = resolve(cwd, CONFIG_FILENAME);

  if (!existsSync(configPath)) {
    return ok({
      config: defaultConfig(),
      path: null,
      source: "defaults",
    });
  }

  try {
    const size = statSync(configPath).size;
    if (size > MAX_CONFIG_BYTES) {
      return err(
        invalidConfig("Config file is too large", {
          path: configPath,
          size,
          limit: MAX_CONFIG_BYTES,
        }),
      );
    }
  } catch (error) {
    return err(
      new AppError("CONFIG_READ_FAILED", "Unable to stat the config file", {
        details: { path: configPath },
        cause: error,
      }),
    );
  }

  let raw: string;
  try {
    raw = readFileSync(configPath, "utf8").replace(/^\uFEFF/, "");
  } catch (error) {
    return err(
      new AppError("CONFIG_READ_FAILED", "Unable to read the config file", {
        details: { path: configPath },
        cause: error,
      }),
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    return err(
      invalidConfig("Config file is not valid JSON", {
        path: configPath,
        reason: error instanceof Error ? error.message : "unknown parse error",
      }),
    );
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return err(
      invalidConfig("Config root must be a JSON object", { path: configPath }),
    );
  }

  const version = (parsed as Record<string, unknown>).version;
  if (version !== CONFIG_VERSION) {
    return err(
      new AppError(
        "CONFIG_VERSION_UNSUPPORTED",
        `Config version must be ${CONFIG_VERSION}; found ${String(version)}. ` +
          "v4 configs require `autopilot migrate` (not available in this alpha).",
        {
          details: { path: configPath, expectedVersion: CONFIG_VERSION, foundVersion: version },
        },
      ),
    );
  }

  const result = ConfigSchema.safeParse(parsed);
  if (!result.success) {
    return err(
      invalidConfig("Config validation failed", {
        path: configPath,
        issues: result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          code: issue.code,
          message: issue.message,
        })),
      }),
    );
  }

  return ok({
    config: result.data,
    path: configPath,
    source: "file",
  });
}
