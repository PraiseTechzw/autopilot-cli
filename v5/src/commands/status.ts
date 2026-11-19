import { getStatus } from "../core/status.js";
import { jsonSuccess, writeJson, writeOut } from "../core/output.js";
import { emitFailure } from "./helpers.js";

export async function statusCommand(
  json: boolean,
  cwd: string = process.cwd(),
): Promise<number> {
  const result = await getStatus(cwd);
  if (!result.ok) {
    return emitFailure("status", result.error, json);
  }

  if (json) {
    writeJson(jsonSuccess("status", result.value));
    return 0;
  }

  const { repo, config, control } = result.value;
  writeOut(`repo:    ${repo.root}`);
  writeOut(`branch:  ${repo.branch ?? "(none)"}${repo.detached ? " (detached)" : ""}`);
  writeOut(`head:    ${repo.head ?? "(no commits)"}`);
  writeOut(`state:   ${repo.operations.length === 0 ? "clean" : repo.operations.join(", ")}`);
  writeOut(`config:  ${config.path ?? "safe defaults"}`);
  writeOut(`ai:      ${config.aiEnabled ? "enabled" : "disabled"}`);
  writeOut(`push:    ${config.autoPush ? "automatic" : "manual"}`);
  writeOut(`watcher: ${control.running ? "running" : "not running"}`);
  writeOut(`note:    ${control.note}`);

  return 0;
}
