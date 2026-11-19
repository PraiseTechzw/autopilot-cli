import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const CLI = fileURLToPath(new URL("../src/cli.js", import.meta.url));

interface CliResult {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

function run(args: readonly string[], cwd: string): CliResult {
  const result = spawnSync(process.execPath, [CLI, ...args], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, AUTOPILOT_AI_KEY: "" },
  });

  return {
    status: result.status,
    stdout: String(result.stdout),
    stderr: String(result.stderr),
  };
}

function withTempDir(runIn: (dir: string) => void): void {
  const dir = mkdtempSync(join(tmpdir(), "autopilot-v5-cli-"));
  try {
    runIn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function writeConfig(dir: string, config: unknown): void {
  writeFileSync(join(dir, ".autopilotrc.json"), JSON.stringify(config));
}

test("version --json emits exactly one JSON document", () => {
  withTempDir((dir) => {
    const result = run(["version", "--json"], dir);
    assert.equal(result.status, 0);
    assert.equal(result.stdout.trim().split("\n").length, 1);

    const parsed = JSON.parse(result.stdout) as {
      ok: boolean;
      data: { name: string; version: string };
    };

    assert.equal(parsed.ok, true);
    assert.equal(parsed.data.name, "@traisetech/autopilot-v5");
    assert.equal(parsed.data.version, "5.0.0-alpha.0");
  });
});

test("config validate --json accepts a v5 config", () => {
  withTempDir((dir) => {
    writeConfig(dir, { version: 5 });

    const result = run(["config", "validate", "--json"], dir);
    assert.equal(result.status, 0);

    const parsed = JSON.parse(result.stdout) as {
      ok: boolean;
      data: { valid: boolean; source: string };
    };

    assert.equal(parsed.ok, true);
    assert.equal(parsed.data.valid, true);
    assert.equal(parsed.data.source, "file");
  });
});

test("config validate --json rejects a v4 config", () => {
  withTempDir((dir) => {
    writeConfig(dir, { version: 4 });

    const result = run(["config", "validate", "--json"], dir);
    assert.equal(result.status, 1);

    const parsed = JSON.parse(result.stdout) as {
      ok: boolean;
      error: { code: string };
    };

    assert.equal(parsed.ok, false);
    assert.equal(parsed.error.code, "CONFIG_VERSION_UNSUPPORTED");
  });
});

test("status --json reads repository state without claiming a watcher", () => {
  withTempDir((dir) => {
    execFileSync("git", ["init", "-q", "-b", "main"], { cwd: dir });
    writeConfig(dir, { version: 5 });

    const result = run(["status", "--json"], dir);
    assert.equal(result.status, 0);

    const parsed = JSON.parse(result.stdout) as {
      ok: boolean;
      data: {
        repo: { branch: string; detached: boolean; operations: string[] };
        control: { running: boolean; available: boolean };
      };
    };

    assert.equal(parsed.ok, true);
    assert.equal(parsed.data.repo.branch, "main");
    assert.equal(parsed.data.repo.detached, false);
    assert.deepEqual(parsed.data.repo.operations, []);
    assert.equal(parsed.data.control.running, false);
    assert.equal(parsed.data.control.available, false);
  });
});

test("doctor --json fails when AI is enabled without a key", () => {
  withTempDir((dir) => {
    execFileSync("git", ["init", "-q", "-b", "main"], { cwd: dir });
    writeConfig(dir, {
      version: 5,
      ai: { enabled: true, provider: "openai" },
    });

    const result = run(["doctor", "--json"], dir);
    assert.equal(result.status, 1);

    const parsed = JSON.parse(result.stdout) as {
      ok: boolean;
      error: { code: string; details: { checks: Array<{ id: string; status: string }> } };
    };

    assert.equal(parsed.ok, false);
    assert.equal(parsed.error.code, "DOCTOR_FAILED");
    const aiCheck = parsed.error.details.checks.find((item) => item.id === "ai");
    assert.equal(aiCheck?.status, "fail");
  });
});

test("doctor --json passes on a healthy local repository", () => {
  withTempDir((dir) => {
    execFileSync("git", ["init", "-q", "-b", "feature/test"], { cwd: dir });
    writeConfig(dir, { version: 5 });

    const result = run(["doctor", "--json"], dir);
    assert.equal(result.status, 0);

    const parsed = JSON.parse(result.stdout) as {
      ok: boolean;
      data: { healthy: boolean; checks: Array<{ id: string; status: string }> };
    };

    assert.equal(parsed.ok, true);
    assert.equal(parsed.data.healthy, true);
    assert.equal(parsed.data.checks.every((item) => item.status !== "fail"), true);
  });
});
