import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { AppError } from "../errors.js";
import { err, ok, type Result } from "../result.js";

interface RawGitResult {
  readonly stdout: string;
  readonly stderr: string;
}

export type GitOperation =
  | "merge"
  | "rebase"
  | "cherry-pick"
  | "revert"
  | "bisect";

export interface GitBranch {
  readonly name: string | null;
  readonly detached: boolean;
}

const OPERATION_MARKERS: ReadonlyArray<{
  readonly operation: GitOperation;
  readonly paths: readonly string[];
}> = [
  { operation: "merge", paths: ["MERGE_HEAD"] },
  { operation: "rebase", paths: ["rebase-merge", "rebase-apply"] },
  { operation: "cherry-pick", paths: ["CHERRY_PICK_HEAD"] },
  { operation: "revert", paths: ["REVERT_HEAD"] },
  { operation: "bisect", paths: ["BISECT_LOG"] },
];

function runGit(cwd: string, args: readonly string[]): Promise<RawGitResult> {
  return new Promise((resolvePromise, reject) => {
    execFile(
      "git",
      [...args],
      {
        cwd,
        encoding: "utf8",
        windowsHide: true,
        maxBuffer: 16 * 1024 * 1024,
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(
            Object.assign(error, {
              stdout: String(stdout),
              stderr: String(stderr),
            }),
          );
          return;
        }

        resolvePromise({ stdout: String(stdout), stderr: String(stderr) });
      },
    );
  });
}

export class GitAdapter {
  constructor(readonly cwd: string = process.cwd()) {}

  private async run(
    args: readonly string[],
  ): Promise<Result<RawGitResult, AppError>> {
    try {
      return ok(await runGit(this.cwd, args));
    } catch (error) {
      const failure = error as {
        readonly code?: string | number;
        readonly stderr?: string;
        readonly message?: string;
      };

      if (failure.code === "ENOENT") {
        return err(
          new AppError(
            "GIT_NOT_FOUND",
            "Git is not installed or is not available on PATH",
            { details: { command: args.join(" ") }, cause: error },
          ),
        );
      }

      return err(
        new AppError(
          "GIT_COMMAND_FAILED",
          `git ${args[0] ?? "command"} failed`,
          {
            details: {
              command: args.join(" "),
              exitCode: failure.code,
              stderr: failure.stderr?.trim() ?? "",
            },
            cause: error,
          },
        ),
      );
    }
  }

  async isRepository(): Promise<boolean> {
    const result = await this.run(["rev-parse", "--is-inside-work-tree"]);
    return result.ok && result.value.stdout.trim() === "true";
  }

  async root(): Promise<Result<string, AppError>> {
    const result = await this.run(["rev-parse", "--show-toplevel"]);
    if (!result.ok) {
      return result;
    }

    return ok(result.value.stdout.trim());
  }

  async head(): Promise<string | null> {
    const result = await this.run(["rev-parse", "--short", "HEAD"]);
    return result.ok ? result.value.stdout.trim() : null;
  }

  async branch(): Promise<GitBranch> {
    const symbolic = await this.run(["symbolic-ref", "--quiet", "--short", "HEAD"]);
    if (symbolic.ok) {
      return { name: symbolic.value.stdout.trim(), detached: false };
    }

    const head = await this.head();
    return { name: head, detached: head !== null };
  }

  async version(): Promise<string | null> {
    const result = await this.run(["version"]);
    return result.ok ? result.value.stdout.trim() : null;
  }

  async operations(): Promise<readonly GitOperation[]> {
    const active: GitOperation[] = [];

    for (const marker of OPERATION_MARKERS) {
      for (const markerPath of marker.paths) {
        const result = await this.run([
          "rev-parse",
          "--git-path",
          markerPath,
        ]);
        if (!result.ok) {
          continue;
        }

        const absolute = resolve(this.cwd, result.value.stdout.trim());
        if (existsSync(absolute)) {
          active.push(marker.operation);
          break;
        }
      }
    }

    return active;
  }
}
