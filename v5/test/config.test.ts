import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { CONFIG_FILENAME, loadConfig } from "../src/core/config/load.js";
import {
  ConfigSchema,
  defaultConfig,
} from "../src/core/config/schema.js";

function withTempDir(run: (dir: string) => void): void {
  const dir = mkdtempSync(join(tmpdir(), "autopilot-v5-config-"));
  try {
    run(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("defaults are safe", () => {
  const config = defaultConfig();

  assert.equal(config.version, 5);
  assert.equal(config.ai.enabled, false);
  assert.equal(config.ai.provider, "none");
  assert.equal(config.git.autoPush, false);
  assert.equal(config.privacy.leaderboard, false);
  assert.equal(config.privacy.telemetry, false);
  assert.equal(config.privacy.updateCheck, false);
  assert.equal(config.safety.secrets, "block");
  assert.equal(config.safety.scanStagedBlobsOnly, true);
});

test("rejects unknown secret-bearing fields", () => {
  const result = ConfigSchema.safeParse({
    version: 5,
    ai: { enabled: false, apiKey: "must-not-be-in-config" },
  });

  assert.equal(result.success, false);
});

test("requires a provider when AI is enabled", () => {
  const result = ConfigSchema.safeParse({
    version: 5,
    ai: { enabled: true },
  });

  assert.equal(result.success, false);
});

test("rejects disabling or softening secret scanning", () => {
  for (const secrets of ["off", "warn"]) {
    const result = ConfigSchema.safeParse({
      version: 5,
      safety: { secrets },
    });

    assert.equal(result.success, false, `secrets=${secrets} must be rejected`);
  }
});

test("loads a valid file config", () => {
  withTempDir((dir) => {
    writeFileSync(
      join(dir, CONFIG_FILENAME),
      JSON.stringify({ version: 5, git: { autoPush: false } }),
    );

    const loaded = loadConfig(dir);
    assert.equal(loaded.ok, true);
    if (!loaded.ok) return;

    assert.equal(loaded.value.source, "file");
    assert.equal(loaded.value.config.git.autoPush, false);
    assert.equal(loaded.value.config.ai.enabled, false);
  });
});

test("uses safe defaults when no config exists", () => {
  withTempDir((dir) => {
    const loaded = loadConfig(dir);
    assert.equal(loaded.ok, true);
    if (!loaded.ok) return;

    assert.equal(loaded.value.source, "defaults");
    assert.equal(loaded.value.path, null);
    assert.equal(loaded.value.config.ai.enabled, false);
  });
});

test("rejects a v4 config with a migration message", () => {
  withTempDir((dir) => {
    writeFileSync(join(dir, CONFIG_FILENAME), JSON.stringify({ version: 4 }));

    const loaded = loadConfig(dir);
    assert.equal(loaded.ok, false);
    if (loaded.ok) return;

    assert.equal(loaded.error.code, "CONFIG_VERSION_UNSUPPORTED");
    assert.match(loaded.error.message, /migrate/);
  });
});

test("rejects malformed JSON without echoing file contents", () => {
  withTempDir((dir) => {
    writeFileSync(join(dir, CONFIG_FILENAME), "{ nope");

    const loaded = loadConfig(dir);
    assert.equal(loaded.ok, false);
    if (loaded.ok) return;

    assert.equal(loaded.error.code, "CONFIG_INVALID");
  });
});
