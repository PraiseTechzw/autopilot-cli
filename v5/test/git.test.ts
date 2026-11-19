import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { GitAdapter } from "../src/core/git/adapter.js";

function createRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), "autopilot-v5-git-"));
  execFileSync("git", ["init", "-q", "-b", "main"], { cwd: dir });
  return dir;
}

function commitAll(dir: string): void {
  writeFileSync(join(dir, "README.md"), "# test\n");
  execFileSync("git", ["add", "README.md"], { cwd: dir });
  execFileSync(
    "git",
    [
      "-c",
      "user.name=Autopilot Test",
      "-c",
      "user.email=autopilot@example.invalid",
      "commit",
      "-q",
      "-m",
      "init",
    ],
    { cwd: dir },
  );
}

test("reads a repository, branch, head, and clean operation state", async () => {
  const dir = createRepo();
  try {
    const git = new GitAdapter(dir);

    assert.equal(await git.isRepository(), true);
    assert.equal(await git.head(), null);

    const branch = await git.branch();
    assert.equal(branch.name, "main");
    assert.equal(branch.detached, false);
    assert.deepEqual(await git.operations(), []);

    commitAll(dir);
    assert.notEqual(await git.head(), null);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("reports a detached HEAD", async () => {
  const dir = createRepo();
  try {
    commitAll(dir);
    execFileSync("git", ["checkout", "-q", "--detach"], { cwd: dir });

    const branch = await new GitAdapter(dir).branch();
    assert.equal(branch.detached, true);
    assert.notEqual(branch.name, null);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("detects an in-progress merge marker", async () => {
  const dir = createRepo();
  try {
    commitAll(dir);
    writeFileSync(join(dir, ".git", "MERGE_HEAD"), "not-a-real-sha\n");

    assert.deepEqual(await new GitAdapter(dir).operations(), ["merge"]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
