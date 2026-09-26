"""Resumable, auditable development workflow orchestration."""

from dataclasses import asdict, dataclass
from datetime import datetime, timezone
import json
from pathlib import Path
import time
from typing import Callable

from .ai import CodeReviewer, CommitMessageGenerator, PRSummaryGenerator, ReviewFinding
from .checkpoints import CheckpointManager, FlightRecorder
from .github import GitHubClient, PullRequest, WorkflowRun
from .git_engine import GitEngine, GitError
from .memory import ProjectMemory
from .permissions import PermissionPolicy, Risk
from .project_analyzer import ProjectAnalyzer, ProjectProfile
from .test_runner import TestRun, TestRunner
from .observability import EventLogger
from .intelligence import ChangeDetector, ChangeGroup
from .verification import VerificationEngine, VerificationResult
from .autonomous import ControlledExecutor


@dataclass(frozen=True)
class ProjectContext:
    profile: ProjectProfile
    branch: str
    head_sha: str
    clean: bool
    changes: tuple[str, ...]
    memory: tuple[str, ...]
    recent_events: tuple[dict, ...]


@dataclass(frozen=True)
class WorkflowState:
    phase: str
    updated_at: str
    branch: str
    head_sha: str
    last_error: str = ""


class WorkflowStateStore:
    def __init__(self, root: str | Path = ".") -> None:
        self.path = Path(root).expanduser().resolve() / ".autopilot" / "workflow.json"

    def load(self) -> WorkflowState | None:
        if not self.path.exists():
            return None
        try:
            data = json.loads(self.path.read_text())
            return WorkflowState(str(data["phase"]), str(data["updated_at"]), str(data["branch"]), str(data["head_sha"]), str(data.get("last_error", "")))
        except (OSError, json.JSONDecodeError, KeyError, TypeError) as exc:
            raise ValueError(f"invalid workflow state: {exc}") from exc

    def save(self, phase: str, branch: str, head_sha: str, last_error: str = "") -> WorkflowState:
        state = WorkflowState(phase, datetime.now(timezone.utc).isoformat(), branch, head_sha, last_error[:500])
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text(json.dumps(asdict(state), indent=2) + "\n")
        return state


class ContextRecovery:
    def __init__(self, root: str | Path = ".") -> None:
        self.root = Path(root).expanduser().resolve()
        self.git = GitEngine(self.root)
        self.memory = ProjectMemory(self.root)
        self.recorder = FlightRecorder(self.root)

    def recover(self) -> ProjectContext:
        status = self.git.status()
        head_sha = self.git._git("rev-parse", "HEAD", check=False).stdout.strip() or "NO_COMMIT"
        entries = self.memory.entries()
        return ProjectContext(
            profile=ProjectAnalyzer(self.root).analyze(),
            branch=status.branch,
            head_sha=head_sha,
            clean=status.clean,
            changes=status.entries,
            memory=tuple(f"{item.category}: {item.content}" for item in entries),
            recent_events=tuple(self.recorder.events(limit=20)),
        )


@dataclass(frozen=True)
class WorkflowResult:
    phase: str
    commit: str = ""
    pull_request: PullRequest | None = None
    test: TestRun | None = None
    findings: tuple[ReviewFinding, ...] = ()
    changes: tuple[ChangeGroup, ...] = ()
    verification: VerificationResult | None = None


class DevelopmentWorkflow:
    """Runs the local verification path, then explicitly gated GitHub side effects."""

    def __init__(self, root: str | Path = ".", *, provider=None, github: GitHubClient | None = None) -> None:
        self.root = Path(root).expanduser().resolve()
        self.git = GitEngine(self.root)
        self.provider = provider
        self.github = github
        self.state = WorkflowStateStore(self.root)
        self.recorder = FlightRecorder(self.root)
        self.checkpoints = CheckpointManager(self.root)
        self.observability = EventLogger(self.root)

    def run(
        self,
        *,
        owner: str,
        repo: str,
        base: str = "main",
        head: str | None = None,
        allow_medium: bool = False,
        allow_high: bool = False,
        draft: bool = False,
        push: bool = False,
        max_iterations: int = 1,
    ) -> WorkflowResult:
        policy = PermissionPolicy(allow_medium=allow_medium, allow_high=allow_high)
        context = ContextRecovery(self.root).recover()
        self.state.save("recovered", context.branch, context.head_sha)
        self.recorder.record("workflow_started", branch=context.branch, head_sha=context.head_sha)
        self.observability.emit("workflow_started", branch=context.branch, head_sha=context.head_sha)
        if context.clean:
            self.state.save("blocked", context.branch, context.head_sha, "working tree is clean")
            raise GitError("working tree is clean; no development changes to verify")
        self.checkpoints.create("workflow-before-verification")
        diff = self.git.diff(staged=True)
        if not diff.strip():
            self.state.save("blocked", context.branch, context.head_sha, "no staged changes")
            raise GitError("stage changes before running the end-to-end workflow")
        profile = context.profile
        memory = ProjectMemory(self.root)
        change_groups = ChangeDetector().detect(diff)
        self.recorder.record("changes_grouped", groups=str(len(change_groups)), summary=ChangeDetector().summary(diff))
        findings = CodeReviewer(self.provider, profile, memory).review(diff)
        self.recorder.record("verification_reviewed", findings=str(len(findings)))
        self.observability.emit("verification_reviewed", findings=len(findings))
        if any(item.severity == "HIGH" for item in findings):
            self.state.save("blocked", context.branch, context.head_sha, "high-risk review finding")
            self.recorder.record("workflow_blocked", reason="high-risk review finding")
            return WorkflowResult("blocked", findings=findings, changes=change_groups)
        verification_iterations = ControlledExecutor(self.root, max_iterations=max_iterations).verify_until_stable()
        verification = verification_iterations[-1].verification
        test_check = next((check for check in verification.checks if check.name == "tests"), None)
        test = TestRun(test_check.result.command, test_check.result) if test_check and test_check.result else None
        self.recorder.record("verification_completed", checks=str(len(verification.checks)), passed=str(verification.passed))
        self.observability.emit("verification_completed", checks=len(verification.checks), passed=verification.passed)
        if not verification.passed:
            self.state.save("blocked", context.branch, context.head_sha, "tests failed")
            return WorkflowResult("blocked", test=test, findings=findings, changes=change_groups, verification=verification)
        policy.require(Risk.MEDIUM, "workflow commit")
        message = CommitMessageGenerator(self.provider, profile, memory).generate(diff)
        commit_output = self.git.commit(message)
        new_sha = self.git._git("rev-parse", "HEAD").stdout.strip()
        self.state.save("committed", context.branch, new_sha)
        self.recorder.record("workflow_committed", commit=new_sha, message=message)
        self.observability.emit("workflow_committed", commit=new_sha, message=message)
        if not self.github:
            return WorkflowResult("committed", commit=commit_output, test=test, findings=findings, changes=change_groups, verification=verification)
        if push:
            policy.require(Risk.HIGH, "workflow push")
            self.recorder.record("workflow_push_attempt", branch=context.branch)
            self.git.push("origin", context.branch, set_upstream=True)
            self.recorder.record("workflow_pushed", branch=context.branch, commit=new_sha)
            self.observability.emit("workflow_pushed", branch=context.branch, commit=new_sha)
        policy.require(Risk.HIGH, "workflow pull request")
        generated_title, generated_body = PRSummaryGenerator(self.provider, profile, memory).generate(diff, message)
        pr = self.github.create_pull_request(owner, repo, generated_title, generated_body, head or context.branch, base, draft)
        self.state.save("pr_created", context.branch, new_sha)
        self.recorder.record("workflow_pr_created", number=str(pr.number), url=pr.url)
        self.observability.emit("workflow_pr_created", number=pr.number, url=pr.url)
        return WorkflowResult("pr_created", commit=commit_output, pull_request=pr, test=test, findings=findings, changes=change_groups, verification=verification)


class BoundedWatcher:
    """Finite polling helper; it never creates a background daemon or hidden schedule."""

    def __init__(self, interval: float = 5.0, iterations: int = 1, sleeper: Callable[[float], None] = time.sleep) -> None:
        if interval < 0 or iterations < 1:
            raise ValueError("interval must be non-negative and iterations must be positive")
        self.interval, self.iterations, self.sleeper = interval, iterations, sleeper

    def watch(self, poll: Callable[[], object]) -> tuple[object, ...]:
        results = []
        for index in range(self.iterations):
            results.append(poll())
            if index + 1 < self.iterations and self.interval:
                self.sleeper(self.interval)
        return tuple(results)
