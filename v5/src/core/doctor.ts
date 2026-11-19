import { loadConfig } from "./config/load.js";
import { GitAdapter } from "./git/adapter.js";

export type CheckStatus = "pass" | "warn" | "fail";

export interface DoctorCheck {
  readonly id: string;
  readonly status: CheckStatus;
  readonly message: string;
}

export interface DoctorReport {
  readonly healthy: boolean;
  readonly checks: readonly DoctorCheck[];
}

function check(
  id: string,
  status: CheckStatus,
  message: string,
): DoctorCheck {
  return { id, status, message };
}

export async function runDoctor(
  cwd: string = process.cwd(),
): Promise<DoctorReport> {
  const checks: DoctorCheck[] = [];
  const nodeMajor = Number.parseInt(process.versions.node, 10);

  checks.push(
    nodeMajor >= 22
      ? check("node", "pass", `Node ${process.versions.node}`)
      : check(
          "node",
          "fail",
          `Node ${process.versions.node} is below the required >=22`,
        ),
  );

  const git = new GitAdapter(cwd);
  const gitVersion = await git.version();
  checks.push(
    gitVersion === null
      ? check("git", "fail", "Git is not installed or is not on PATH")
      : check("git", "pass", gitVersion),
  );

  const isRepository = await git.isRepository();
  checks.push(
    isRepository
      ? check("repository", "pass", "Inside a Git work tree")
      : check("repository", "fail", "Not inside a Git work tree"),
  );

  const loaded = loadConfig(cwd);
  if (!loaded.ok) {
    checks.push(check("config", "fail", loaded.error.message));
  } else if (loaded.value.source === "defaults") {
    checks.push(check("config", "pass", "No config file; using safe defaults"));
  } else {
    checks.push(check("config", "pass", `Config valid: ${loaded.value.path}`));
  }

  if (isRepository) {
    const operations = await git.operations();
    checks.push(
      operations.length === 0
        ? check("git-state", "pass", "No merge, rebase, or pick in progress")
        : check(
            "git-state",
            "fail",
            `Git operation in progress: ${operations.join(", ")}`,
          ),
    );

    if (loaded.ok) {
      const branch = await git.branch();
      if (branch.name === null) {
        checks.push(check("branch", "warn", "No branch or commit yet"));
      } else if (loaded.value.config.git.protectedBranches.includes(branch.name)) {
        checks.push(
          check(
            "branch",
            "warn",
            `On protected branch "${branch.name}"; pushes will be blocked`,
          ),
        );
      } else {
        checks.push(check("branch", "pass", `On branch "${branch.name}"`));
      }
    }
  }

  if (loaded.ok) {
    const { ai, privacy } = loaded.value.config;

    if (!ai.enabled) {
      checks.push(check("ai", "pass", "AI disabled (safe default)"));
    } else if (!process.env.AUTOPILOT_AI_KEY) {
      checks.push(
        check(
          "ai",
          "fail",
          "AI is enabled but AUTOPILOT_AI_KEY is not set",
        ),
      );
    } else {
      checks.push(check("ai", "pass", "AI enabled with a key from the environment"));
    }

    const networkFeatures = [
      privacy.leaderboard ? "leaderboard" : null,
      privacy.telemetry ? "telemetry" : null,
      privacy.updateCheck ? "updateCheck" : null,
    ].filter((feature): feature is string => feature !== null);

    checks.push(
      networkFeatures.length === 0
        ? check("privacy", "pass", "Network features disabled")
        : check(
            "privacy",
            "warn",
            `Network features enabled: ${networkFeatures.join(", ")}`,
          ),
    );
  }

  return {
    healthy: checks.every((item) => item.status !== "fail"),
    checks,
  };
}
