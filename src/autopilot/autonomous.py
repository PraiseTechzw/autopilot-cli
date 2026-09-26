"""Controlled autonomy: plan tasks, execute only bounded safe steps, and propose fixes."""

from dataclasses import dataclass
from datetime import datetime, timezone
import json
from pathlib import Path
import re

from .checkpoints import CheckpointManager, FlightRecorder
from .ci_analysis import CIFailureReport
from .intelligence import ChangeDetector
from .permissions import PermissionPolicy, Risk
from .project_analyzer import ProjectProfile
from .providers import AIProvider, ChatMessage
from .verification import VerificationEngine, VerificationResult


@dataclass(frozen=True)
class PlanStep:
    id: str
    action: str
    description: str
    risk: Risk
    requires_approval: bool


@dataclass(frozen=True)
class TaskPlan:
    task: str
    steps: tuple[PlanStep, ...]
    context_summary: str
    generated_by: str


@dataclass(frozen=True)
class FixProposal:
    title: str
    rationale: str
    files: tuple[str, ...]
    patch: str
    risk: Risk
    requires_approval: bool = True


@dataclass(frozen=True)
class Iteration:
    number: int
    verification: VerificationResult
    stopped_reason: str


class TaskPlanner:
    def __init__(self, profile: ProjectProfile | None = None, provider: AIProvider | None = None) -> None:
        self.profile, self.provider = profile, provider

    def plan(self, task: str, *, context: str = "") -> TaskPlan:
        task = task.strip()
        if not task:
            raise ValueError("task cannot be empty")
        if self.provider:
            prompt = "Create a safe development plan. Return ONLY JSON with a steps array; each step must have id, action, description, risk (low/medium/high), requires_approval. Allowed actions: inspect, propose, verify, commit, push, pr. Never include arbitrary shell commands.\n\nTask: " + task + "\nContext:\n" + context[:6000]
            try:
                raw = self.provider.complete([ChatMessage("system", "You are a cautious software delivery planner."), ChatMessage("user", prompt)], response_format={"type": "json_object"})
                data = json.loads(raw.strip().removeprefix("```").removeprefix("json").removesuffix("```").strip())
                steps = tuple(self._validate_step(item) for item in data["steps"])
                if steps:
                    return TaskPlan(task, steps, context[:2000], "ai")
            except (json.JSONDecodeError, KeyError, TypeError, ValueError):
                pass
        lowered = task.lower()
        steps = [PlanStep("inspect", "inspect", "Recover project context and locate relevant files.", Risk.LOW, False)]
        if any(word in lowered for word in ("fix", "implement", "change", "add", "debug")):
            steps.append(PlanStep("propose", "propose", "Prepare a bounded code-change proposal for review.", Risk.MEDIUM, True))
        steps.append(PlanStep("verify", "verify", "Run security scanning, tests, and available quality checks.", Risk.LOW, False))
        if any(word in lowered for word in ("ship", "release", "pull request", "pr")):
            steps.extend((PlanStep("commit", "commit", "Create a commit after verification.", Risk.MEDIUM, True), PlanStep("pr", "pr", "Create a pull request after explicit high-risk approval.", Risk.HIGH, True)))
        return TaskPlan(task, tuple(steps), context[:2000], "deterministic")

    @staticmethod
    def _validate_step(item: dict) -> PlanStep:
        if not isinstance(item, dict) or item.get("action") not in {"inspect", "propose", "verify", "commit", "push", "pr"}:
            raise ValueError("invalid plan step")
        risk = Risk(str(item.get("risk", "low")).lower())
        return PlanStep(str(item["id"]), str(item["action"]), str(item["description"]), risk, bool(item.get("requires_approval", risk is not Risk.LOW)))


class FixProposer:
    def __init__(self, profile: ProjectProfile | None = None, provider: AIProvider | None = None) -> None:
        self.profile, self.provider = profile, provider

    def from_verification(self, result: VerificationResult, *, context: str = "") -> tuple[FixProposal, ...]:
        failures = [check for check in result.failed if check.required]
        if not failures:
            return ()
        if self.provider:
            prompt = "Propose a minimal safe fix for the required verification failure. Return ONLY JSON with title, rationale, files (array), patch (unified diff), risk. Never execute commands, include secrets, or claim the patch was applied.\n\n" + context[:3000] + "\nFailure:\n" + "\n".join(f"{item.name}: {item.detail}" for item in failures)
            try:
                data = json.loads(self.provider.complete([ChatMessage("system", "You propose reviewable test-driven code fixes."), ChatMessage("user", prompt)], response_format={"type": "json_object"}))
                files = tuple(str(item) for item in data.get("files", []))
                if any(Path(item).is_absolute() or ".." in Path(item).parts for item in files):
                    raise ValueError("unsafe file path")
                return (FixProposal(str(data["title"]), str(data["rationale"]), files, str(data.get("patch", "")), Risk(str(data.get("risk", "medium")).lower())),)
            except (json.JSONDecodeError, KeyError, TypeError, ValueError):
                pass
        return tuple(FixProposal(f"Fix {check.name} failure", check.detail or "Required verification failed.", (), "", Risk.MEDIUM) for check in failures)

    def from_ci(self, report: CIFailureReport, *, context: str = "") -> FixProposal:
        if self.provider:
            prompt = "Propose a safe code fix for this CI failure. Return ONLY JSON with title, rationale, files (array), patch (unified diff), risk. Do not claim the patch was applied. Do not include secrets or arbitrary commands.\n\n" + context[:3000] + "\nCI diagnosis:\n" + report.explanation[:5000]
            try:
                data = json.loads(self.provider.complete([ChatMessage("system", "You propose reviewable code fixes, never execute them."), ChatMessage("user", prompt)], response_format={"type": "json_object"}))
                files = tuple(str(item) for item in data.get("files", []))
                if any(Path(item).is_absolute() or ".." in Path(item).parts for item in files):
                    raise ValueError("unsafe file path")
                patch = str(data.get("patch", ""))
                if re.search(r"(?i)(api[_-]?key|password|secret|token)\s*[:=]", patch):
                    raise ValueError("proposal contains a secret-like assignment")
                return FixProposal(str(data["title"]), str(data["rationale"]), files, patch, Risk(str(data.get("risk", "medium")).lower()))
            except (json.JSONDecodeError, KeyError, TypeError, ValueError):
                pass
        return FixProposal("Investigate CI failure", report.explanation[:1000], report.suspected_files, "", Risk.MEDIUM)


class ControlledExecutor:
    """Executes only inspect/verify actions and records every bounded iteration."""

    def __init__(self, root: str | Path = ".", *, max_iterations: int = 3) -> None:
        if max_iterations < 1 or max_iterations > 10:
            raise ValueError("max_iterations must be between 1 and 10")
        self.root = Path(root).expanduser().resolve()
        self.max_iterations = max_iterations
        self.recorder = FlightRecorder(self.root)
        self.checkpoints = CheckpointManager(self.root)

    def verify_until_stable(self) -> tuple[Iteration, ...]:
        iterations: list[Iteration] = []
        for number in range(1, self.max_iterations + 1):
            verification = VerificationEngine(self.root).run()
            reason = "passed" if verification.passed else "required checks still failing"
            iterations.append(Iteration(number, verification, reason))
            self.recorder.record("autonomous_verification_iteration", iteration=str(number), passed=str(verification.passed))
            if verification.passed:
                break
        if iterations and not iterations[-1].verification.passed:
            self.recorder.record("autonomous_verification_stopped", reason="iteration limit reached")
        return tuple(iterations)

    def require_action(self, action: str, risk: Risk, *, allow_medium: bool = False, allow_high: bool = False) -> None:
        PermissionPolicy(allow_medium=allow_medium, allow_high=allow_high).require(risk, action)
        self.checkpoints.create(f"before-{action}")
        self.recorder.record("autonomous_action_approved", action=action, risk=risk.value, timestamp=datetime.now(timezone.utc).isoformat())
