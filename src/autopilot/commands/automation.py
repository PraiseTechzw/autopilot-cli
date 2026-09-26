"""Bounded automation, recovery, debugging, and task execution commands."""

from pathlib import Path
import json

import typer

from ..autonomous import ControlledExecutor, FixProposer, FixProposal, TaskPlanner
from ..checkpoints import CheckpointManager
from ..ci_analysis import CIFailureAnalyzer
from ..debugging import DebuggingLoop
from ..git_engine import GitError
from ..github import GitHubError
from ..memory import ProjectMemory
from ..patching import PatchApplier, PatchError
from ..permissions import Risk
from ..project_analyzer import ProjectAnalyzer
from ..providers import AIProviderError
from ..task_execution import TaskExecutor
from ..workflow import BoundedWatcher, ContextRecovery, DevelopmentWorkflow, WorkflowStateStore
from . import CommandDeps

_deps: CommandDeps


def register(app: typer.Typer, deps: CommandDeps) -> None:
    global _deps
    _deps = deps
    app.command("plan")(plan)
    app.command("iterate")(iterate)
    app.command("apply-fix")(apply_fix)
    app.command("undo")(undo)
    app.command("debug")(debug)
    app.command("propose-fix")(propose_fix)
    app.command("execute-task")(execute_task)
    app.command("resume")(resume)
    app.command("replay")(replay)
    app.command("watch")(watch)
    app.command("ci-analyze")(ci_analyze)
    app.command("workflow")(workflow)


def plan(task: str, path: Path = typer.Option(Path("."), "--path", "-p"), use_ai: bool = typer.Option(False, "--ai")) -> None:
    """Create a bounded task plan; no steps are executed."""
    try:
        context = ContextRecovery(path).recover()
        summary = f"languages={context.profile.languages}; architecture={context.profile.architecture}; changes={context.changes}; memory={context.memory}"
        result = TaskPlanner(context.profile, _deps.provider_for(path, use_ai)).plan(task, context=summary)
        typer.echo(json.dumps({"task": result.task, "generated_by": result.generated_by, "context_summary": result.context_summary, "steps": [item.__dict__ for item in result.steps]}, default=str, indent=2))
    except (GitError, ValueError, AIProviderError) as exc:
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)


def iterate(path: Path = typer.Option(Path("."), "--path", "-p"), max_iterations: int = typer.Option(3, "--max-iterations", min=1, max=10)) -> None:
    """Run bounded verification iterations; it never edits code automatically."""
    try:
        results = ControlledExecutor(path, max_iterations=max_iterations).verify_until_stable()
    except ValueError as exc:
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)
    for iteration in results:
        typer.echo(f"Iteration {iteration.number}: {'PASS' if iteration.verification.passed else 'BLOCKED'} ({iteration.stopped_reason})")
        for check in iteration.verification.checks:
            typer.echo(f"  [{'PASS' if check.passed else 'FAIL'}] {check.name}: {check.detail}")
    if results and not results[-1].verification.passed:
        raise typer.Exit(code=2)


def apply_fix(patch_file: Path, path: Path = typer.Option(Path("."), "--path", "-p"), risk: Risk = typer.Option(Risk.MEDIUM, "--risk"), approve: bool = typer.Option(False, "--approve", help="Confirm this reviewed patch may be applied."), allow_medium: bool = typer.Option(False, "--allow-medium"), allow_high: bool = typer.Option(False, "--allow-high")) -> None:
    """Apply a reviewed unified patch with checkpoint, scanning, and permission gates."""
    try:
        patch = patch_file.read_text(encoding="utf-8")
        files = tuple(line[6:] for line in patch.splitlines() if line.startswith("+++ b/"))
        result = PatchApplier(path).apply(FixProposal(f"Apply {patch_file.name}", "User-reviewed patch", files, patch, risk), allow_medium=allow_medium, allow_high=allow_high, approve=approve)
        typer.echo(json.dumps(result.__dict__, indent=2))
    except (OSError, PatchError, PermissionError) as exc:
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)


def undo(path: Path = typer.Option(Path("."), "--path", "-p"), patch_id: str | None = typer.Option(None, "--patch-id")) -> None:
    """Reverse the latest applied AI patch, or a selected patch ID."""
    try:
        recovered = PatchApplier(path).rollback_last(patch_id)
    except (PatchError, GitError) as exc:
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)
    typer.echo(f"Rolled back AI patch {recovered}")


def debug(path: Path = typer.Option(Path("."), "--path", "-p"), max_iterations: int = typer.Option(3, "--max-iterations", min=1, max=10), use_ai: bool = typer.Option(False, "--ai"), allow_medium: bool = typer.Option(False, "--allow-medium"), allow_high: bool = typer.Option(False, "--allow-high")) -> None:
    """Run bounded test-driven debugging using provider-generated proposals when configured."""
    try:
        profile = ProjectAnalyzer(path).analyze()
        proposer = FixProposer(profile, _deps.provider_for(path, use_ai))
        def propose(verification):
            proposals = proposer.from_verification(verification, context=str(profile))
            return proposals[0] if proposals else FixProposal("No fix", "", (), "", Risk.MEDIUM)
        results = DebuggingLoop(path, max_iterations=max_iterations).run(propose, allow_medium=allow_medium, allow_high=allow_high)
        for item in results:
            typer.echo(f"Iteration {item.number}: {item.reason}")
        if results and not results[-1].verification.passed:
            raise typer.Exit(code=2)
    except (ValueError, PatchError, PermissionError, GitError, AIProviderError) as exc:
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)


def propose_fix(owner: str = typer.Option(..., "--owner"), repo: str = typer.Option(..., "--repo"), run_id: int = typer.Option(..., "--run-id"), path: Path = typer.Option(Path("."), "--path", "-p"), use_ai: bool = typer.Option(False, "--ai")) -> None:
    """Generate a reviewable CI fix proposal; never apply it automatically."""
    try:
        client = _deps.github_client()
        run = next((item for item in client.workflow_runs(owner, repo, per_page=100) if item.run_id == run_id), None)
        if run is None:
            raise GitHubError(f"workflow run not found in recent runs: {run_id}")
        profile = ProjectAnalyzer(path).analyze()
        report = CIFailureAnalyzer(client, _deps.provider_for(path, use_ai), profile, ProjectMemory(path)).analyze(owner, repo, run)
        proposal = FixProposer(profile, _deps.provider_for(path, use_ai)).from_ci(report, context=f"architecture={profile.architecture}; entrypoints={profile.entrypoints}")
        CheckpointManager(path).recorder.record("ci_fix_proposed", run_id=str(run_id), files=",".join(proposal.files), applied="false")
        typer.echo(json.dumps(proposal.__dict__, default=str, indent=2))
    except (GitHubError, ValueError, AIProviderError) as exc:
        CheckpointManager(path).recorder.record("ci_fix_proposal_failed", run_id=str(run_id), error=str(exc)[:300])
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)


def execute_task(task: str, path: Path = typer.Option(Path("."), "--path", "-p"), use_ai: bool = typer.Option(False, "--ai", help="Use the configured AI provider to generate a multi-file patch."), approve: bool = typer.Option(False, "--approve", help="Approve applying the generated patch."), allow_medium: bool = typer.Option(False, "--allow-medium"), allow_high: bool = typer.Option(False, "--allow-high"), commit: bool = typer.Option(False, "--commit", help="Commit only after verification and explicit approval."), max_iterations: int = typer.Option(3, "--max-iterations", min=1, max=10)) -> None:
    """Complete one bounded task from clean repository to verified code."""
    try:
        result = TaskExecutor(path, provider=_deps.provider_for(path, use_ai), max_iterations=max_iterations).execute(task, approve=approve, allow_medium=allow_medium, allow_high=allow_high, commit=commit)
        typer.echo(json.dumps({"task": result.task, "plan": [item.__dict__ for item in result.plan.steps], "files": result.patch.files, "checkpoint": result.patch.checkpoint, "verified": result.verification.passed, "checks": [{"name": item.name, "passed": item.passed, "required": item.required, "detail": item.detail} for item in result.verification.checks], "debug_iterations": len(result.debugging), "commit": result.commit}, default=str, indent=2))
        if not result.verification.passed:
            raise typer.Exit(code=2)
    except (ValueError, PatchError, PermissionError, GitError, AIProviderError) as exc:
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)


def resume(path: Path = typer.Option(Path("."), "--path", "-p"), json_output: bool = typer.Option(False, "--json", help="Emit machine-readable JSON.")) -> None:
    """Recover project context and the last recorded workflow state."""
    try:
        context = ContextRecovery(path).recover()
        state = WorkflowStateStore(path).load()
    except (GitError, ValueError) as exc:
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)
    typer.echo(json.dumps({"branch": context.branch, "head_sha": context.head_sha, "clean": context.clean, "changes": context.changes, "languages": context.profile.languages, "frameworks": context.profile.frameworks, "memory": context.memory, "workflow": state.__dict__ if state else None}, default=str, indent=2))


def replay(path: Path = typer.Option(Path("."), "--path", "-p"), limit: int = typer.Option(50, min=1, max=1000)) -> None:
    """Replay the flight recorder as an audit report; no actions are re-executed."""
    for event in CheckpointManager(path).recorder.replay(limit=limit):
        typer.echo(json.dumps(event, sort_keys=True))


def watch(path: Path = typer.Option(Path("."), "--path", "-p"), iterations: int = typer.Option(1, min=1, max=1000), interval: float = typer.Option(5.0, min=0.0), owner: str | None = typer.Option(None, "--owner"), repo: str | None = typer.Option(None, "--repo")) -> None:
    """Poll local workflow context or GitHub CI a bounded number of times."""
    if bool(owner) != bool(repo):
        typer.echo("Error: --owner and --repo must be supplied together", err=True)
        raise typer.Exit(code=1)
    try:
        if owner and repo:
            client = _deps.github_client()
            results = BoundedWatcher(interval, iterations).watch(lambda: client.workflow_runs(owner, repo))
            for runs in results:
                latest = runs[0] if runs else None
                typer.echo("No workflow runs found." if latest is None else f"{latest.name}: {latest.status}/{latest.conclusion or 'pending'} {latest.url}")
        else:
            results = BoundedWatcher(interval, iterations).watch(lambda: ContextRecovery(path).recover())
            for context in results:
                typer.echo(f"{context.branch} {context.head_sha} {'clean' if context.clean else f'{len(context.changes)} change(s)'}")
    except (GitError, GitHubError, ValueError) as exc:
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)


def ci_analyze(owner: str = typer.Option(..., "--owner"), repo: str = typer.Option(..., "--repo"), run_id: int = typer.Option(..., "--run-id"), path: Path = typer.Option(Path("."), "--path", "-p"), use_ai: bool = typer.Option(False, "--ai")) -> None:
    """Analyze a completed failed GitHub Actions run without modifying code."""
    try:
        client = _deps.github_client()
        runs = client.workflow_runs(owner, repo, per_page=100)
        run = next((item for item in runs if item.run_id == run_id), None)
        if run is None:
            raise GitHubError(f"workflow run not found in recent runs: {run_id}")
        provider = _deps.provider_for(path, use_ai)
        report = CIFailureAnalyzer(client, provider, ProjectAnalyzer(path).analyze(), ProjectMemory(path)).analyze(owner, repo, run)
        CheckpointManager(path).recorder.record("ci_failure_analyzed", run_id=str(run_id), files=",".join(report.suspected_files))
        typer.echo(json.dumps({"run_id": run_id, "failed_lines": report.failed_lines, "suspected_files": report.suspected_files, "category": report.category, "confidence": report.confidence, "reproduction_command": report.reproduction_command, "explanation": report.explanation}, indent=2))
    except (GitHubError, ValueError, AIProviderError) as exc:
        CheckpointManager(path).recorder.record("ci_failure_analysis_failed", run_id=str(run_id), error=str(exc)[:300])
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)


def workflow(owner: str = typer.Option(..., "--owner"), repo: str = typer.Option(..., "--repo"), base: str = typer.Option("main", "--base"), head: str | None = typer.Option(None, "--head"), path: Path = typer.Option(Path("."), "--path", "-p"), use_ai: bool = typer.Option(False, "--ai"), draft: bool = typer.Option(False, "--draft"), allow_medium: bool = typer.Option(False, "--allow-medium"), allow_high: bool = typer.Option(False, "--allow-high"), push: bool = typer.Option(False, "--push", help="Push the committed branch before PR creation; requires --allow-high."), max_iterations: int = typer.Option(1, "--max-iterations", min=1, max=10, help="Bound verification iterations before blocking.")) -> None:
    """Run staged verification, commit, PR creation, and return CI-ready status."""
    try:
        provider = _deps.provider_for(path, use_ai)
        result = DevelopmentWorkflow(path, provider=provider, github=_deps.github_client()).run(owner=owner, repo=repo, base=base, head=head, allow_medium=allow_medium, allow_high=allow_high, draft=draft, push=push, max_iterations=max_iterations)
        payload = {"phase": result.phase, "commit": result.commit, "test_returncode": result.test.result.returncode if result.test else None, "findings": [item.__dict__ for item in result.findings], "changes": [item.__dict__ for item in result.changes], "verification": [{"name": item.name, "passed": item.passed, "required": item.required, "detail": item.detail} for item in result.verification.checks] if result.verification else None, "pull_request": result.pull_request.__dict__ if result.pull_request else None}
        typer.echo(json.dumps(payload, default=str, indent=2))
        if result.phase == "blocked":
            raise typer.Exit(code=2)
    except (GitError, GitHubError, AIProviderError, PermissionError) as exc:
        CheckpointManager(path).recorder.record("workflow_failed", error=str(exc)[:300])
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)
