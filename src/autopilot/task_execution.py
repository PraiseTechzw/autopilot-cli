"""End-to-end bounded task-to-code execution."""

from dataclasses import dataclass
import json
from pathlib import Path

from .ai import CommitMessageGenerator
from .autonomous import FixProposal, FixProposer, TaskPlan, TaskPlanner
from .checkpoints import FlightRecorder
from .debugging import DebugIteration, DebuggingLoop
from .git_engine import GitEngine
from .memory import ProjectMemory
from .patching import PatchApplier, PatchResult
from .permissions import PermissionPolicy, Risk
from .project_analyzer import ProjectProfile
from .prompt_safety import redact_secrets
from .providers import AIProvider, ChatMessage
from .task_context import CodebaseContext, CodebaseContextBuilder
from .verification import VerificationEngine, VerificationResult


@dataclass(frozen=True)
class TaskExecutionResult:
    task: str
    plan: TaskPlan
    context: CodebaseContext
    proposal: FixProposal
    patch: PatchResult
    verification: VerificationResult
    debugging: tuple[DebugIteration, ...] = ()
    commit: str = ""


class TaskCodeGenerator:
    def __init__(self, provider: AIProvider, profile: ProjectProfile) -> None:
        self.provider, self.profile = provider, profile

    def generate(self, task: str, context: CodebaseContext) -> FixProposal:
        prompt = (
            "Implement this bounded development task. Return ONLY JSON with title, rationale, files (array), patch (unified diff), and risk (medium or high). "
            "The patch may modify multiple files but only relative repository paths. Do not include secrets, binary data, arbitrary commands, generated lockfile churn, or claims that tests passed. "
            "Keep the change minimal and test-driven.\n\nTASK:\n" + task + "\n\nCODEBASE CONTEXT:\n" + context.render()
        )
        raw = self.provider.complete([ChatMessage("system", "You are a careful coding agent. Produce reviewable patches only."), ChatMessage("user", redact_secrets(prompt))], response_format={"type": "json_object"})
        try:
            data = json.loads(raw.strip().removeprefix("```").removeprefix("json").removesuffix("```").strip())
            files = tuple(str(item) for item in data["files"])
            if not files or any(Path(item).is_absolute() or ".." in Path(item).parts for item in files):
                raise ValueError("unsafe or empty file list")
            risk = Risk(str(data.get("risk", "medium")).lower())
            return FixProposal(str(data["title"]), str(data["rationale"]), files, str(data["patch"]), risk, True)
        except (json.JSONDecodeError, KeyError, TypeError, ValueError) as exc:
            raise ValueError(f"AI returned an invalid code proposal: {exc}") from exc


class TaskExecutor:
    def __init__(self, root: str | Path = ".", *, provider: AIProvider | None = None, max_iterations: int = 3) -> None:
        if max_iterations < 1 or max_iterations > 10:
            raise ValueError("max_iterations must be between 1 and 10")
        self.root = Path(root).expanduser().resolve()
        self.provider = provider
        self.max_iterations = max_iterations
        self.recorder = FlightRecorder(self.root)

    def execute(self, task: str, *, approve: bool = False, allow_medium: bool = False, allow_high: bool = False, commit: bool = False) -> TaskExecutionResult:
        if not self.provider:
            raise ValueError("task execution requires an AI provider; use --ai with configured credentials")
        git = GitEngine(self.root)
        git.require_repository()
        before = git.status()
        if not before.clean:
            raise ValueError("working tree must be clean before autonomous task execution")
        context = CodebaseContextBuilder(self.root).build(task)
        plan = TaskPlanner(context.profile, self.provider).plan(task, context=context.render())
        self.recorder.record("task_execution_started", task=task[:300], files=str(len(context.files)), generated_by=plan.generated_by)
        proposal = TaskCodeGenerator(self.provider, context.profile).generate(task, context)
        applier = PatchApplier(self.root)
        patch = applier.apply(proposal, approve=approve, allow_medium=allow_medium, allow_high=allow_high)
        verification = VerificationEngine(self.root).run()
        debugging: tuple[DebugIteration, ...] = ()
        if not verification.passed and self.max_iterations > 1:
            proposer = FixProposer(context.profile, self.provider)
            debugging = DebuggingLoop(self.root, max_iterations=self.max_iterations - 1).run(lambda result: self._first_proposal(proposer, result, context), allow_medium=allow_medium, allow_high=allow_high)
            verification = debugging[-1].verification if debugging else verification
        commit_output = ""
        if not verification.passed:
            self.recorder.record("task_execution_blocked", reason="required verification failed")
            return TaskExecutionResult(task, plan, context, proposal, patch, verification, debugging)
        if commit:
            if not approve:
                raise PermissionError("explicit approval required before task commit")
            PermissionPolicy(allow_medium=allow_medium, allow_high=allow_high).require(Risk.MEDIUM, "task commit")
            git.add(list(patch.files))
            message = CommitMessageGenerator(self.provider, context.profile, ProjectMemory(self.root)).generate(git.diff(staged=True))
            commit_output = git.commit(message)
            self.recorder.record("task_execution_committed", files=",".join(patch.files), message=message)
        self.recorder.record("task_execution_completed", verified="true", committed=str(bool(commit_output)))
        return TaskExecutionResult(task, plan, context, proposal, patch, verification, debugging, commit_output)

    @staticmethod
    def _first_proposal(proposer: FixProposer, result: VerificationResult, context: CodebaseContext) -> FixProposal:
        proposals = proposer.from_verification(result, context=context.render())
        return proposals[0] if proposals else FixProposal("No applicable fix", "", (), "", Risk.MEDIUM)
