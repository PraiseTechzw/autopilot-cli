"""Command-line interface for Autopilot."""

from pathlib import Path
import json
import os
import typer

from . import __version__
from .checkpoints import CheckpointManager
from .ai import CodeReviewer, CommitMessageGenerator, PRSummaryGenerator
from .git_engine import GitEngine, GitError
from .project_analyzer import ProjectAnalyzer
from .security import SecretScanner
from .test_runner import TestRunner
from .memory import ProjectMemory
from .permissions import PermissionPolicy, Risk
from .providers import AIProviderError, configured_provider
from .github import GitHubClient, GitHubError
from .workflow import BoundedWatcher, ContextRecovery, DevelopmentWorkflow, WorkflowStateStore
from .config import ConfigError, config_dir, load_config, initialize_project_config, project_config_path
from .doctor import run_checks
from .observability import EventLogger
from .intelligence import ChangeDetector
from .verification import VerificationEngine
from .autonomous import ControlledExecutor, FixProposer, TaskPlanner
from .ci_analysis import CIFailureAnalyzer
from .patching import PatchApplier, PatchError
from .debugging import DebuggingLoop
from .autonomous import FixProposal
from .task_execution import TaskExecutor

app = typer.Typer(help="Autopilot: safe automation for the software development lifecycle.")
git_app = typer.Typer(help="Inspect and operate on the current Git repository.")
github_app = typer.Typer(help="Explicit GitHub branch, pull-request, and CI operations.")
config_app = typer.Typer(help="Inspect and initialize Autopilot configuration.")
app.add_typer(git_app, name="git")
app.add_typer(github_app, name="github")
app.add_typer(config_app, name="config")


def engine(path: Path) -> GitEngine:
    return GitEngine(path)


def provider_for(path: Path, use_ai: bool):
    if not use_ai:
        return None
    provider = configured_provider()
    if provider is None:
        typer.echo("Error: --ai requires OPENROUTER_API_KEY or AI_API_KEY", err=True)
        raise typer.Exit(code=1)
    return provider


def github_client() -> GitHubClient:
    token = os.getenv("GITHUB_TOKEN") or os.getenv("GH_TOKEN")
    if not token:
        typer.echo("Error: set GITHUB_TOKEN or GH_TOKEN before using GitHub commands", err=True)
        raise typer.Exit(code=1)
    return GitHubClient(token, os.getenv("GITHUB_API_URL", "https://api.github.com"))


def require_high_permission(allow_high: bool, action: str) -> None:
    PermissionPolicy(allow_high=allow_high).require(Risk.HIGH, action)


@app.callback()
def main() -> None:
    """Autopilot developer workflow agent."""


@app.command()
def version() -> None:
    """Print the installed Autopilot version."""
    typer.echo(__version__)


@app.command()
def doctor(path: Path = typer.Option(Path("."), "--path", "-p")) -> None:
    """Run read-only installation and integration diagnostics."""
    checks = run_checks(path)
    failed_required = False
    for check in checks:
        marker = "OK" if check.ok else "FAIL"
        optional = " (optional)" if not check.required else ""
        typer.echo(f"[{marker}] {check.name}{optional}: {check.detail}")
        failed_required |= check.required and not check.ok
    if failed_required:
        raise typer.Exit(code=1)


@config_app.command("show")
def config_show(path: Path = typer.Option(Path("."), "--path", "-p")) -> None:
    """Show effective redacted configuration and its source."""
    try:
        typer.echo(json.dumps({"config_dir": str(config_dir()), "project_config": str(project_config_path(path)), "effective": load_config(path).redacted()}, indent=2))
    except ConfigError as exc:
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)


@config_app.command("init")
def config_init(path: Path = typer.Option(Path("."), "--path", "-p"), overwrite: bool = typer.Option(False, "--overwrite")) -> None:
    """Create a project config template without secrets."""
    try:
        created = initialize_project_config(path, overwrite=overwrite)
    except ConfigError as exc:
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)
    typer.echo(f"Created {created}")


@app.command("events")
def events(path: Path = typer.Option(Path("."), "--path", "-p"), limit: int = typer.Option(50, min=1, max=1000)) -> None:
    """Show structured observability events with secrets redacted."""
    for event in EventLogger(path).read(limit):
        typer.echo(json.dumps(event, sort_keys=True))


@app.command()
def status(path: Path = typer.Option(Path("."), "--path", "-p"), json_output: bool = typer.Option(False, "--json", help="Emit machine-readable JSON.")) -> None:
    """Show a concise project and Git status."""
    try:
        git = engine(path)
        current = git.status()
    except GitError as exc:
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)
    state = "clean" if current.clean else f"{len(current.entries)} change(s)"
    if json_output:
        typer.echo(json.dumps({"repository": str(git.path), "branch": current.branch, "clean": current.clean, "changes": current.entries}, indent=2))
        return
    typer.echo(f"Repository: {git.path}")
    typer.echo(f"Branch: {current.branch}")
    typer.echo(f"Working tree: {state}")


@app.command()
def analyze(path: Path = typer.Option(Path("."), "--path", "-p")) -> None:
    """Analyze the repository without executing project code."""
    typer.echo(json.dumps(ProjectAnalyzer(path).analyze().__dict__, default=str, indent=2))


@app.command("changes")
def changes(path: Path = typer.Option(Path("."), "--path", "-p"), staged: bool = typer.Option(False, "--staged")) -> None:
    """Group changed files into logical areas and show their risk."""
    try:
        diff = engine(path).diff(staged=staged)
    except GitError as exc:
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)
    groups = ChangeDetector().detect(diff)
    if not groups:
        typer.echo("No changed files detected.")
        return
    for group in groups:
        typer.echo(f"{group.name}: {group.kind}, {group.risk} risk ({len(group.files)} file(s))")
        for file in group.files:
            typer.echo(f"  - {file}")


@app.command("verify")
def verify(path: Path = typer.Option(Path("."), "--path", "-p")) -> None:
    """Run security, tests, and available lint/type checks."""
    result = VerificationEngine(path).run()
    for check in result.checks:
        marker = "PASS" if check.passed else "FAIL"
        typer.echo(f"[{marker}] {check.name}: {check.detail}")
    if not result.passed:
        raise typer.Exit(code=2)


@app.command("plan")
def plan(task: str, path: Path = typer.Option(Path("."), "--path", "-p"), use_ai: bool = typer.Option(False, "--ai")) -> None:
    """Create a bounded task plan; no steps are executed."""
    try:
        context = ContextRecovery(path).recover()
        summary = f"languages={context.profile.languages}; architecture={context.profile.architecture}; changes={context.changes}; memory={context.memory}"
        result = TaskPlanner(context.profile, provider_for(path, use_ai)).plan(task, context=summary)
        typer.echo(json.dumps({"task": result.task, "generated_by": result.generated_by, "context_summary": result.context_summary, "steps": [item.__dict__ for item in result.steps]}, default=str, indent=2))
    except (GitError, ValueError, AIProviderError) as exc:
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)


@app.command("iterate")
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
            typer.echo(f"  [{ 'PASS' if check.passed else 'FAIL' }] {check.name}: {check.detail}")
    if results and not results[-1].verification.passed:
        raise typer.Exit(code=2)


@app.command("apply-fix")
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


@app.command("undo")
def undo(path: Path = typer.Option(Path("."), "--path", "-p"), patch_id: str | None = typer.Option(None, "--patch-id")) -> None:
    """Reverse the latest applied AI patch, or a selected patch ID."""
    try:
        recovered = PatchApplier(path).rollback_last(patch_id)
    except (PatchError, GitError) as exc:
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)
    typer.echo(f"Rolled back AI patch {recovered}")


@app.command("debug")
def debug(path: Path = typer.Option(Path("."), "--path", "-p"), max_iterations: int = typer.Option(3, "--max-iterations", min=1, max=10), use_ai: bool = typer.Option(False, "--ai"), allow_medium: bool = typer.Option(False, "--allow-medium"), allow_high: bool = typer.Option(False, "--allow-high")) -> None:
    """Run bounded test-driven debugging using provider-generated proposals when configured."""
    try:
        profile = ProjectAnalyzer(path).analyze()
        proposer = FixProposer(profile, provider_for(path, use_ai))
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


@app.command("propose-fix")
def propose_fix(owner: str = typer.Option(..., "--owner"), repo: str = typer.Option(..., "--repo"), run_id: int = typer.Option(..., "--run-id"), path: Path = typer.Option(Path("."), "--path", "-p"), use_ai: bool = typer.Option(False, "--ai")) -> None:
    """Generate a reviewable CI fix proposal; never apply it automatically."""
    try:
        client = github_client()
        run = next((item for item in client.workflow_runs(owner, repo, per_page=100) if item.run_id == run_id), None)
        if run is None:
            raise GitHubError(f"workflow run not found in recent runs: {run_id}")
        profile = ProjectAnalyzer(path).analyze()
        report = CIFailureAnalyzer(client, provider_for(path, use_ai), profile, ProjectMemory(path)).analyze(owner, repo, run)
        proposal = FixProposer(profile, provider_for(path, use_ai)).from_ci(report, context=f"architecture={profile.architecture}; entrypoints={profile.entrypoints}")
        CheckpointManager(path).recorder.record("ci_fix_proposed", run_id=str(run_id), files=",".join(proposal.files), applied="false")
        typer.echo(json.dumps(proposal.__dict__, default=str, indent=2))
    except (GitHubError, ValueError, AIProviderError) as exc:
        CheckpointManager(path).recorder.record("ci_fix_proposal_failed", run_id=str(run_id), error=str(exc)[:300])
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)


@app.command("execute-task")
def execute_task(task: str, path: Path = typer.Option(Path("."), "--path", "-p"), use_ai: bool = typer.Option(False, "--ai", help="Use the configured AI provider to generate a multi-file patch."), approve: bool = typer.Option(False, "--approve", help="Approve applying the generated patch."), allow_medium: bool = typer.Option(False, "--allow-medium"), allow_high: bool = typer.Option(False, "--allow-high"), commit: bool = typer.Option(False, "--commit", help="Commit only after verification and explicit approval."), max_iterations: int = typer.Option(3, "--max-iterations", min=1, max=10)) -> None:
    """Complete one bounded task from clean repository to verified code."""
    try:
        result = TaskExecutor(path, provider=provider_for(path, use_ai), max_iterations=max_iterations).execute(task, approve=approve, allow_medium=allow_medium, allow_high=allow_high, commit=commit)
        typer.echo(json.dumps({"task": result.task, "plan": [item.__dict__ for item in result.plan.steps], "files": result.patch.files, "checkpoint": result.patch.checkpoint, "verified": result.verification.passed, "checks": [{"name": item.name, "passed": item.passed, "required": item.required, "detail": item.detail} for item in result.verification.checks], "debug_iterations": len(result.debugging), "commit": result.commit}, default=str, indent=2))
        if not result.verification.passed:
            raise typer.Exit(code=2)
    except (ValueError, PatchError, PermissionError, GitError, AIProviderError) as exc:
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)


@app.command("test")
def test_project(path: Path = typer.Option(Path("."), "--path", "-p")) -> None:
    """Discover and run the project's tests."""
    try:
        run = TestRunner(path).run()
    except (ValueError, OSError) as exc:
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)
    typer.echo(run.result.stdout, nl=False)
    if run.result.stderr:
        typer.echo(run.result.stderr, err=True, nl=False)
    raise typer.Exit(code=run.result.returncode)


@app.command("scan")
def scan(path: Path = typer.Option(Path("."), "--path", "-p")) -> None:
    """Scan tracked-style project files for likely secrets."""
    findings = SecretScanner().scan(path)
    if not findings:
        typer.echo("No likely secrets detected.")
        return
    for finding in findings:
        typer.echo(f"{finding.path}:{finding.line}: {finding.kind}: {finding.excerpt}")
    raise typer.Exit(code=2)


@app.command("commit-message")
def commit_message(path: Path = typer.Option(Path("."), "--path", "-p"), staged: bool = typer.Option(False, "--staged"), use_ai: bool = typer.Option(False, "--ai", help="Use the configured AI provider.")) -> None:
    """Suggest a conventional commit message from the current diff."""
    try:
        diff = engine(path).diff(staged=staged)
    except GitError as exc:
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)
    try:
        provider = provider_for(path, use_ai)
        typer.echo(CommitMessageGenerator(provider, ProjectAnalyzer(path).analyze(), ProjectMemory(path)).generate(diff))
    except AIProviderError as exc:
        typer.echo(f"AI error: {exc}", err=True)
        raise typer.Exit(code=1)


@app.command("review")
def review(path: Path = typer.Option(Path("."), "--path", "-p"), staged: bool = typer.Option(False, "--staged"), use_ai: bool = typer.Option(False, "--ai", help="Use the configured AI provider.")) -> None:
    """Run conservative local review checks against a diff."""
    try:
        diff = engine(path).diff(staged=staged)
    except GitError as exc:
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)
    try:
        provider = provider_for(path, use_ai)
        findings = CodeReviewer(provider, ProjectAnalyzer(path).analyze(), ProjectMemory(path)).review(diff)
    except AIProviderError as exc:
        typer.echo(f"AI error: {exc}", err=True)
        raise typer.Exit(code=1)
    if not findings:
        typer.echo("No local review findings.")
        return
    for finding in findings:
        typer.echo(f"{finding.severity}: {finding.title}\n  {finding.explanation}\n  Suggestion: {finding.suggestion}")


@app.command("commit")
def commit(
    path: Path = typer.Option(Path("."), "--path", "-p"),
    message: str | None = typer.Option(None, "--message", "-m"),
    staged: bool = typer.Option(True, "--staged/--all", help="Use staged changes; --all includes the working diff in the prompt only."),
    use_ai: bool = typer.Option(False, "--ai", help="Generate the message with the configured AI provider."),
    allow_medium: bool = typer.Option(False, "--allow-medium", help="Explicitly permit the medium-risk commit action."),
) -> None:
    """Create one commit after review and an explicit permission gate."""
    policy = PermissionPolicy(allow_medium=allow_medium)
    try:
        policy.require(Risk.MEDIUM, "commit")
        git = engine(path)
        diff = git.diff(staged=staged)
        if not diff.strip():
            typer.echo("Error: no diff available to commit", err=True)
            raise typer.Exit(code=1)
        provider = provider_for(path, use_ai)
        findings = CodeReviewer(provider, ProjectAnalyzer(path).analyze(), ProjectMemory(path)).review(diff)
        high = [finding for finding in findings if finding.severity == "HIGH"]
        if high:
            typer.echo("Commit blocked: high-risk review findings must be resolved first.", err=True)
            for finding in high:
                typer.echo(f"- {finding.title}: {finding.suggestion}", err=True)
            raise typer.Exit(code=2)
        commit_message_value = message or CommitMessageGenerator(provider, ProjectAnalyzer(path).analyze(), ProjectMemory(path)).generate(diff)
        typer.echo(git.commit(commit_message_value), nl=False)
    except (GitError, AIProviderError, PermissionError) as exc:
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)


@app.command()
def checkpoint(path: Path = typer.Option(Path("."), "--path", "-p"), label: str = typer.Option("checkpoint")) -> None:
    """Record a reversible Git checkpoint and audit event."""
    try:
        point = CheckpointManager(path).create(label)
    except GitError as exc:
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)
    typer.echo(f"Checkpoint '{point.label}' recorded at {point.commit}")


@app.command("remember")
def remember(category: str, content: str, path: Path = typer.Option(Path("."), "--path", "-p")) -> None:
    """Store a project decision or convention."""
    try:
        entry = ProjectMemory(path).add(category, content)
    except ValueError as exc:
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)
    typer.echo(f"Remembered [{entry.category}] {entry.content}")


@app.command("memory")
def memory(query: str | None = typer.Argument(None), path: Path = typer.Option(Path("."), "--path", "-p")) -> None:
    """List project decisions, or search relevant memory with a query."""
    store = ProjectMemory(path)
    entries = store.relevant(query) if query else store.entries()
    for entry in entries:
        typer.echo(f"[{entry.category}] {entry.content}")


@app.command("resume")
def resume(path: Path = typer.Option(Path("."), "--path", "-p")) -> None:
    """Recover project context and the last recorded workflow state."""
    try:
        context = ContextRecovery(path).recover()
        state = WorkflowStateStore(path).load()
    except (GitError, ValueError) as exc:
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)
    typer.echo(json.dumps({"branch": context.branch, "head_sha": context.head_sha, "clean": context.clean, "changes": context.changes, "languages": context.profile.languages, "frameworks": context.profile.frameworks, "memory": context.memory, "workflow": state.__dict__ if state else None}, default=str, indent=2))


@app.command("replay")
def replay(path: Path = typer.Option(Path("."), "--path", "-p"), limit: int = typer.Option(50, min=1, max=1000)) -> None:
    """Replay the flight recorder as an audit report; no actions are re-executed."""
    for event in CheckpointManager(path).recorder.replay(limit=limit):
        typer.echo(json.dumps(event, sort_keys=True))


@app.command("watch")
def watch(path: Path = typer.Option(Path("."), "--path", "-p"), iterations: int = typer.Option(1, min=1, max=1000), interval: float = typer.Option(5.0, min=0.0), owner: str | None = typer.Option(None, "--owner"), repo: str | None = typer.Option(None, "--repo")) -> None:
    """Poll local workflow context or GitHub CI a bounded number of times."""
    if bool(owner) != bool(repo):
        typer.echo("Error: --owner and --repo must be supplied together", err=True)
        raise typer.Exit(code=1)
    try:
        if owner and repo:
            client = github_client()
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


@app.command("ci-analyze")
def ci_analyze(owner: str = typer.Option(..., "--owner"), repo: str = typer.Option(..., "--repo"), run_id: int = typer.Option(..., "--run-id"), path: Path = typer.Option(Path("."), "--path", "-p"), use_ai: bool = typer.Option(False, "--ai")) -> None:
    """Analyze a completed failed GitHub Actions run without modifying code."""
    try:
        client = github_client()
        runs = client.workflow_runs(owner, repo, per_page=100)
        run = next((item for item in runs if item.run_id == run_id), None)
        if run is None:
            raise GitHubError(f"workflow run not found in recent runs: {run_id}")
        provider = provider_for(path, use_ai)
        report = CIFailureAnalyzer(client, provider, ProjectAnalyzer(path).analyze(), ProjectMemory(path)).analyze(owner, repo, run)
        CheckpointManager(path).recorder.record("ci_failure_analyzed", run_id=str(run_id), files=",".join(report.suspected_files))
        typer.echo(json.dumps({"run_id": run_id, "failed_lines": report.failed_lines, "suspected_files": report.suspected_files, "category": report.category, "confidence": report.confidence, "reproduction_command": report.reproduction_command, "explanation": report.explanation}, indent=2))
    except (GitHubError, ValueError, AIProviderError) as exc:
        CheckpointManager(path).recorder.record("ci_failure_analysis_failed", run_id=str(run_id), error=str(exc)[:300])
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)


@app.command("workflow")
def workflow(
    owner: str = typer.Option(..., "--owner"),
    repo: str = typer.Option(..., "--repo"),
    base: str = typer.Option("main", "--base"),
    head: str | None = typer.Option(None, "--head"),
    path: Path = typer.Option(Path("."), "--path", "-p"),
    use_ai: bool = typer.Option(False, "--ai"),
    draft: bool = typer.Option(False, "--draft"),
    allow_medium: bool = typer.Option(False, "--allow-medium"),
    allow_high: bool = typer.Option(False, "--allow-high"),
    push: bool = typer.Option(False, "--push", help="Push the committed branch before PR creation; requires --allow-high."),
    max_iterations: int = typer.Option(1, "--max-iterations", min=1, max=10, help="Bound verification iterations before blocking."),
) -> None:
    """Run staged verification, commit, PR creation, and return CI-ready status."""
    try:
        provider = provider_for(path, use_ai)
        result = DevelopmentWorkflow(path, provider=provider, github=github_client()).run(owner=owner, repo=repo, base=base, head=head, allow_medium=allow_medium, allow_high=allow_high, draft=draft, push=push, max_iterations=max_iterations)
        payload = {"phase": result.phase, "commit": result.commit, "test_returncode": result.test.result.returncode if result.test else None, "findings": [item.__dict__ for item in result.findings], "changes": [item.__dict__ for item in result.changes], "verification": [{"name": item.name, "passed": item.passed, "required": item.required, "detail": item.detail} for item in result.verification.checks] if result.verification else None, "pull_request": result.pull_request.__dict__ if result.pull_request else None}
        typer.echo(json.dumps(payload, default=str, indent=2))
        if result.phase == "blocked":
            raise typer.Exit(code=2)
    except (GitError, GitHubError, AIProviderError, PermissionError) as exc:
        CheckpointManager(path).recorder.record("workflow_failed", error=str(exc)[:300])
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)


@git_app.command("status")
def git_status(path: Path = typer.Option(Path("."), "--path", "-p")) -> None:
    """Show Git status entries."""
    try:
        current = engine(path).status()
    except GitError as exc:
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)
    typer.echo(f"On branch {current.branch}")
    typer.echo("clean" if current.clean else "\n".join(current.entries))


@git_app.command("diff")
def git_diff(path: Path = typer.Option(Path("."), "--path", "-p"), staged: bool = typer.Option(False, "--staged")) -> None:
    """Print the working-tree or staged diff."""
    try:
        typer.echo(engine(path).diff(staged=staged), nl=False)
    except GitError as exc:
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)


@git_app.command("log")
def git_log(path: Path = typer.Option(Path("."), "--path", "-p"), limit: int = typer.Option(10, min=1, max=100)) -> None:
    """Print recent commits."""
    try:
        typer.echo(engine(path).log(limit=limit), nl=False)
    except GitError as exc:
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)


@github_app.command("branch")
def github_branch(
    name: str,
    owner: str = typer.Option(..., "--owner"),
    repo: str = typer.Option(..., "--repo"),
    path: Path = typer.Option(Path("."), "--path", "-p"),
    allow_high: bool = typer.Option(False, "--allow-high", help="Explicitly permit creating a remote branch."),
) -> None:
    """Create a remote branch at the current local HEAD."""
    try:
        require_high_permission(allow_high, "create remote branch")
        git = engine(path)
        git.require_repository()
        sha = git._git("rev-parse", "HEAD").stdout.strip()
        recorder = CheckpointManager(path).recorder
        recorder.record("github_branch_attempt", owner=owner, repo=repo, branch=name)
        branch = github_client().create_branch(owner, repo, name, sha)
        recorder.record("github_branch_created", owner=owner, repo=repo, branch=name, sha=branch.sha)
        typer.echo(f"Created {branch.name} at {branch.sha}")
    except (GitError, GitHubError, PermissionError) as exc:
        CheckpointManager(path).recorder.record("github_branch_failed", owner=owner, repo=repo, branch=name, error=str(exc)[:300])
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)


@github_app.command("pr-create")
def github_pr_create(
    owner: str = typer.Option(..., "--owner"),
    repo: str = typer.Option(..., "--repo"),
    head: str = typer.Option(..., "--head"),
    base: str = typer.Option("main", "--base"),
    title: str | None = typer.Option(None, "--title"),
    body: str | None = typer.Option(None, "--body"),
    path: Path = typer.Option(Path("."), "--path", "-p"),
    use_ai: bool = typer.Option(False, "--ai", help="Generate the PR title and body with the configured AI provider."),
    draft: bool = typer.Option(False, "--draft"),
    allow_high: bool = typer.Option(False, "--allow-high", help="Explicitly permit PR creation."),
) -> None:
    """Review the staged diff, summarize it, and create a pull request."""
    try:
        require_high_permission(allow_high, "create pull request")
        git = engine(path)
        current = git.status()
        diff = git.diff(staged=True)
        if not diff.strip():
            typer.echo("Error: no staged diff available for PR creation", err=True)
            raise typer.Exit(code=1)
        provider = provider_for(path, use_ai)
        profile, memory_store = ProjectAnalyzer(path).analyze(), ProjectMemory(path)
        findings = CodeReviewer(provider, profile, memory_store).review(diff)
        high = [finding for finding in findings if finding.severity == "HIGH"]
        if high:
            typer.echo("PR blocked: high-risk review findings must be resolved first.", err=True)
            for finding in high:
                typer.echo(f"- {finding.title}: {finding.suggestion}", err=True)
            raise typer.Exit(code=2)
        generated_title, generated_body = PRSummaryGenerator(provider, profile, memory_store).generate(diff)
        recorder = CheckpointManager(path).recorder
        recorder.record("github_pr_attempt", owner=owner, repo=repo, head=head, base=base)
        pr = github_client().create_pull_request(owner, repo, title or generated_title, body or generated_body, head, base, draft)
        recorder.record("github_pr_created", owner=owner, repo=repo, number=str(pr.number), head=head, base=base)
        typer.echo(f"Created PR #{pr.number}: {pr.title}\n{pr.url}")
    except (GitError, GitHubError, AIProviderError, PermissionError) as exc:
        CheckpointManager(path).recorder.record("github_pr_failed", owner=owner, repo=repo, head=head, error=str(exc)[:300])
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)


@github_app.command("ci-status")
def github_ci_status(
    owner: str = typer.Option(..., "--owner"),
    repo: str = typer.Option(..., "--repo"),
    branch: str | None = typer.Option(None, "--branch"),
    head_sha: str | None = typer.Option(None, "--head-sha"),
    per_page: int = typer.Option(10, "--per-page", min=1, max=100),
) -> None:
    """Read recent GitHub Actions workflow statuses without modifying anything."""
    try:
        runs = github_client().workflow_runs(owner, repo, branch=branch, head_sha=head_sha, per_page=per_page)
        if not runs:
            typer.echo("No workflow runs found.")
            return
        for run in runs:
            conclusion = run.conclusion or "pending"
            typer.echo(f"{run.name}: {run.status}/{conclusion} {run.branch} {run.url}")
    except (GitHubError, ValueError) as exc:
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)


if __name__ == "__main__":
    app()
