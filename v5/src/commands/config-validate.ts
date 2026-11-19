import { loadConfig } from "../core/config/load.js";
import { jsonSuccess, writeJson, writeOut } from "../core/output.js";
import { emitFailure } from "./helpers.js";

export function configValidateCommand(
  json: boolean,
  cwd: string = process.cwd(),
): number {
  const loaded = loadConfig(cwd);
  if (!loaded.ok) {
    return emitFailure("config validate", loaded.error, json);
  }

  if (json) {
    writeJson(
      jsonSuccess("config validate", {
        valid: true,
        path: loaded.value.path,
        source: loaded.value.source,
        config: loaded.value.config,
      }),
    );
    return 0;
  }

  writeOut(
    loaded.value.source === "defaults"
      ? "Config valid: safe defaults (no .autopilotrc.json)"
      : `Config valid: ${loaded.value.path}`,
  );
  return 0;
}
