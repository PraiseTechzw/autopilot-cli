"""Local, Git, configuration, and inspection commands."""

from pathlib import Path
import json

import typer

from .. import __version__
from ..ai import CodeReviewer, CommitMessageGenerator
from ..checkpoints import CheckpointManager
from ..config import ConfigError, config_dir, initialize_project_config, load_config, project_config_path
from ..doctor import run_checks
from ..git_engine import GitError
from ..intelligence import ChangeDetector
from ..memory import ProjectMemory
from ..project_analyzer import ProjectAnalyzer
from ..security import SecretScanner
from ..test_runner import TestRunner
from ..verification import VerificationEngine
from ..permissions import PermissionPolicy, Risk
from ..providers import AIProviderError
from . import CommandDeps

_deps: CommandDeps


def register(app: typer.Typer, git_app: typer.Typer, config_app: typer.Typer, deps: CommandDeps) -> None:
    global _deps
    _deps = deps
    app.command()(version)
    app.command()(doctor)
    config_app.command("show")(config_show)
    config_app.command("init")(config_init)
    app.command("events")(events)
    app.command()(status)
    app.command()(analyze)
    app.command("changes")(changes)
    app.command("verify")(verify)
    app.command("test")(test_project)
    app.command("scan")(scan)
    app.command("commit-message")(commit_message)
    app.command("review")(review)
    app.command("commit")(commit)
    app.command()(checkpoint)
    app.command("remember")(remember)
    app.command("memory")(memory)
    git_app.command("status")(git_status)
    git_app.command("diff")(git_diff)
    git_app.command("log")(git_log)


def version() -> None:
    """Print the installed Autopilot version."""
    typer.echo(__version__)


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


def config_show(path: Path = typer.Option(Path("."), "--path", "-p")) -> None:
    """Show effective redacted configuration and its source."""
    try:
        typer.echo(json.dumps({"config_dir": str(config_dir()), "project_config": str(project_config_path(path)), "effective": load_config(path).redacted()}, indent=2))
    except ConfigError as exc:
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)


def config_init(path: Path = typer.Option(Path("."), "--path", "-p"), overwrite: bool = typer.Option(False, "--overwrite")) -> None:
    """Create a project config template without secrets."""
    try:
        created = initialize_project_config(path, overwrite=overwrite)
    except ConfigError as exc:
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)
    typer.echo(f"Created {created}")


def events(path: Path = typer.Option(Path("."), "--path", "-p"), limit: int = typer.Option(50, min=1, max=1000)) -> None:
    """Show structured observability events with secrets redacted."""
    from ..observability import EventLogger
    for event in EventLogger(path).read(limit):
        typer.echo(json.dumps(event, sort_keys=True))


def status(path: Path = typer.Option(Path("."), "--path", "-p"), json_output: bool = typer.Option(False, "--json", help="Emit machine-readable JSON.")) -> None:
    """Show a concise project and Git status."""
    try:
        git = _deps.engine(path)
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


def analyze(path: Path = typer.Option(Path("."), "--path", "-p"), json_output: bool = typer.Option(False, "--json", help="Emit machine-readable JSON.")) -> None:
    """Analyze the repository without executing project code."""
    typer.echo(json.dumps(ProjectAnalyzer(path).analyze().__dict__, default=str, indent=2))


def changes(path: Path = typer.Option(Path("."), "--path", "-p"), staged: bool = typer.Option(False, "--staged")) -> None:
    """Group changed files into logical areas and show their risk."""
    try:
        diff = _deps.engine(path).diff(staged=staged)
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


def verify(path: Path = typer.Option(Path("."), "--path", "-p"), json_output: bool = typer.Option(False, "--json", help="Emit machine-readable JSON.")) -> None:
    """Run security, tests, and available lint/type checks."""
    result = VerificationEngine(path).run()
    if json_output:
        typer.echo(json.dumps({"passed": result.passed, "checks": [{"name": item.name, "passed": item.passed, "required": item.required, "detail": item.detail} for item in result.checks]}, indent=2))
    for check in result.checks if not json_output else ():
        marker = "PASS" if check.passed else "FAIL"
        typer.echo(f"[{marker}] {check.name}: {check.detail}")
    if not result.passed:
        raise typer.Exit(code=2)


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


def scan(path: Path = typer.Option(Path("."), "--path", "-p")) -> None:
    """Scan tracked-style project files for likely secrets."""
    findings = SecretScanner().scan(path)
    if not findings:
        typer.echo("No likely secrets detected.")
        return
    for finding in findings:
        typer.echo(f"{finding.path}:{finding.line}: {finding.kind}: {finding.excerpt}")
    raise typer.Exit(code=2)


def commit_message(path: Path = typer.Option(Path("."), "--path", "-p"), staged: bool = typer.Option(False, "--staged"), use_ai: bool = typer.Option(False, "--ai", help="Use the configured AI provider.")) -> None:
    """Suggest a conventional commit message from the current diff."""
    try:
        diff = _deps.engine(path).diff(staged=staged)
    except GitError as exc:
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)
    try:
        provider = _deps.provider_for(path, use_ai)
        typer.echo(CommitMessageGenerator(provider, ProjectAnalyzer(path).analyze(), ProjectMemory(path)).generate(diff))
    except AIProviderError as exc:
        typer.echo(f"AI error: {exc}", err=True)
        raise typer.Exit(code=1)


def review(path: Path = typer.Option(Path("."), "--path", "-p"), staged: bool = typer.Option(False, "--staged"), use_ai: bool = typer.Option(False, "--ai", help="Use the configured AI provider."), json_output: bool = typer.Option(False, "--json", help="Emit machine-readable JSON.")) -> None:
    """Run conservative local review checks against a diff."""
    try:
        diff = _deps.engine(path).diff(staged=staged)
    except GitError as exc:
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)
    try:
        provider = _deps.provider_for(path, use_ai)
        findings = CodeReviewer(provider, ProjectAnalyzer(path).analyze(), ProjectMemory(path)).review(diff)
    except AIProviderError as exc:
        typer.echo(f"AI error: {exc}", err=True)
        raise typer.Exit(code=1)
    if json_output:
        typer.echo(json.dumps({"findings": [finding.__dict__ for finding in findings], "high_risk": any(finding.severity == "HIGH" for finding in findings)}, default=str, indent=2))
        return
    if not findings:
        typer.echo("No local review findings.")
        return
    for finding in findings:
        typer.echo(f"{finding.severity}: {finding.title}\n  {finding.explanation}\n  Suggestion: {finding.suggestion}")


def commit(path: Path = typer.Option(Path("."), "--path", "-p"), message: str | None = typer.Option(None, "--message", "-m"), staged: bool = typer.Option(True, "--staged/--all", help="Use staged changes; --all includes the working diff in the prompt only."), use_ai: bool = typer.Option(False, "--ai", help="Generate the message with the configured AI provider."), allow_medium: bool = typer.Option(False, "--allow-medium", help="Explicitly permit the medium-risk commit action.")) -> None:
    """Create one commit after review and an explicit permission gate."""
    policy = PermissionPolicy(allow_medium=allow_medium)
    try:
        policy.require(Risk.MEDIUM, "commit")
        git = _deps.engine(path)
        diff = git.diff(staged=staged)
        if not diff.strip():
            typer.echo("Error: no diff available to commit", err=True)
            raise typer.Exit(code=1)
        provider = _deps.provider_for(path, use_ai)
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


def checkpoint(path: Path = typer.Option(Path("."), "--path", "-p"), label: str = typer.Option("checkpoint")) -> None:
    """Record a reversible Git checkpoint and audit event."""
    try:
        point = CheckpointManager(path).create(label)
    except GitError as exc:
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)
    typer.echo(f"Checkpoint '{point.label}' recorded at {point.commit}")


def remember(category: str, content: str, path: Path = typer.Option(Path("."), "--path", "-p")) -> None:
    """Store a project decision or convention."""
    try:
        entry = ProjectMemory(path).add(category, content)
    except ValueError as exc:
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)
    typer.echo(f"Remembered [{entry.category}] {entry.content}")


def memory(query: str | None = typer.Argument(None), path: Path = typer.Option(Path("."), "--path", "-p")) -> None:
    """List project decisions, or search relevant memory with a query."""
    store = ProjectMemory(path)
    entries = store.relevant(query) if query else store.entries()
    for entry in entries:
        typer.echo(f"[{entry.category}] {entry.content}")


def git_status(path: Path = typer.Option(Path("."), "--path", "-p")) -> None:
    """Show Git status entries."""
    try:
        current = _deps.engine(path).status()
    except GitError as exc:
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)
    typer.echo(f"On branch {current.branch}")
    typer.echo("clean" if current.clean else "\n".join(current.entries))


def git_diff(path: Path = typer.Option(Path("."), "--path", "-p"), staged: bool = typer.Option(False, "--staged")) -> None:
    """Print the working-tree or staged diff."""
    try:
        typer.echo(_deps.engine(path).diff(staged=staged), nl=False)
    except GitError as exc:
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)


def git_log(path: Path = typer.Option(Path("."), "--path", "-p"), limit: int = typer.Option(10, min=1, max=100)) -> None:
    """Print recent commits."""
    try:
        typer.echo(_deps.engine(path).log(limit=limit), nl=False)
    except GitError as exc:
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)
