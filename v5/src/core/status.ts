import { AppError } from "./errors.js";
import { loadConfig } from "./config/load.js";
import { GitAdapter, type GitOperation } from "./git/adapter.js";
import { err, ok, type Result } from "./result.js";

export interface StatusReport {
  readonly repo: {
    readonly root: string;
    readonly branch: string | null;
    readonly detached: boolean;
    readonly head: string | null;
    readonly operations: readonly GitOperation[];
  };
  readonly config: {
    readonly path: string | null;
    readonly source: "defaults" | "file";
    readonly aiEnabled: boolean;
    readonly autoPush: boolean;
    readonly protectedBranches: readonly string[];
  };
  readonly control: {
    readonly available: false;
    readonly running: false;
    readonly note: string;
  };
}

export async function getStatus(
  cwd: string = process.cwd(),
): Promise<Result<StatusReport, AppError>> {
  const loaded = loadConfig(cwd);
  if (!loaded.ok) {
    return loaded;
  }

  const git = new GitAdapter(cwd);
  if (!(await git.isRepository())) {
    return err(
      new AppError("NOT_A_REPOSITORY", "Not inside a Git work tree", {
        details: { cwd },
      }),
    );
  }

  const root = await git.root();
  if (!root.ok) {
    return root;
  }

  const branch = await git.branch();
  const head = await git.head();
  const operations = await git.operations();

  return ok({
    repo: {
      root: root.value,
      branch: branch.name,
      detached: branch.detached,
      head,
      operations,
    },
    config: {
      path: loaded.value.path,
      source: loaded.value.source,
      aiEnabled: loaded.value.config.ai.enabled,
      autoPush: loaded.value.config.git.autoPush,
      protectedBranches: loaded.value.config.git.protectedBranches,
    },
    control: {
      available: false,
      running: false,
      note: "Control plane is not implemented in this Phase 1 alpha",
    },
  });
}
