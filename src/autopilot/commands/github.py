"""Explicit GitHub side-effect and read-only CI commands."""

from pathlib import Path

import typer

from ..ai import CodeReviewer, PRSummaryGenerator
from ..checkpoints import CheckpointManager
from ..github import GitHubError
from ..git_engine import GitError
from ..memory import ProjectMemory
from ..project_analyzer import ProjectAnalyzer
from ..providers import AIProviderError
from . import CommandDeps

_deps: CommandDeps


def register(github_app: typer.Typer, deps: CommandDeps) -> None:
    global _deps
    _deps = deps
    github_app.command("branch")(branch)
    github_app.command("pr-create")(pr_create)
    github_app.command("ci-status")(ci_status)


def branch(name: str, owner: str = typer.Option(..., "--owner"), repo: str = typer.Option(..., "--repo"), path: Path = typer.Option(Path("."), "--path", "-p"), allow_high: bool = typer.Option(False, "--allow-high", help="Explicitly permit creating a remote branch.")) -> None:
    """Create a remote branch at the current local HEAD."""
    try:
        _deps.require_high_permission(allow_high, "create remote branch")
        git = _deps.engine(path)
        git.require_repository()
        sha = git._git("rev-parse", "HEAD").stdout.strip()
        recorder = CheckpointManager(path).recorder
        recorder.record("github_branch_attempt", owner=owner, repo=repo, branch=name)
        created = _deps.github_client().create_branch(owner, repo, name, sha)
        recorder.record("github_branch_created", owner=owner, repo=repo, branch=name, sha=created.sha)
        typer.echo(f"Created {created.name} at {created.sha}")
    except (GitError, GitHubError, PermissionError) as exc:
        CheckpointManager(path).recorder.record("github_branch_failed", owner=owner, repo=repo, branch=name, error=str(exc)[:300])
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)


def pr_create(owner: str = typer.Option(..., "--owner"), repo: str = typer.Option(..., "--repo"), head: str = typer.Option(..., "--head"), base: str = typer.Option("main", "--base"), title: str | None = typer.Option(None, "--title"), body: str | None = typer.Option(None, "--body"), path: Path = typer.Option(Path("."), "--path", "-p"), use_ai: bool = typer.Option(False, "--ai", help="Generate the PR title and body with the configured AI provider."), draft: bool = typer.Option(False, "--draft"), allow_high: bool = typer.Option(False, "--allow-high", help="Explicitly permit PR creation.")) -> None:
    """Review the staged diff, summarize it, and create a pull request."""
    try:
        _deps.require_high_permission(allow_high, "create pull request")
        git = _deps.engine(path)
        git.status()
        diff = git.diff(staged=True)
        if not diff.strip():
            typer.echo("Error: no staged diff available for PR creation", err=True)
            raise typer.Exit(code=1)
        provider = _deps.provider_for(path, use_ai)
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
        pr = _deps.github_client().create_pull_request(owner, repo, title or generated_title, body or generated_body, head, base, draft)
        recorder.record("github_pr_created", owner=owner, repo=repo, number=str(pr.number), head=head, base=base)
        typer.echo(f"Created PR #{pr.number}: {pr.title}\n{pr.url}")
    except (GitError, GitHubError, AIProviderError, PermissionError) as exc:
        CheckpointManager(path).recorder.record("github_pr_failed", owner=owner, repo=repo, head=head, error=str(exc)[:300])
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)


def ci_status(owner: str = typer.Option(..., "--owner"), repo: str = typer.Option(..., "--repo"), branch: str | None = typer.Option(None, "--branch"), head_sha: str | None = typer.Option(None, "--head-sha"), per_page: int = typer.Option(10, "--per-page", min=1, max=100)) -> None:
    """Read recent GitHub Actions workflow statuses without modifying anything."""
    try:
        runs = _deps.github_client().workflow_runs(owner, repo, branch=branch, head_sha=head_sha, per_page=per_page)
        if not runs:
            typer.echo("No workflow runs found.")
            return
        for run in runs:
            conclusion = run.conclusion or "pending"
            typer.echo(f"{run.name}: {run.status}/{conclusion} {run.branch} {run.url}")
    except (GitHubError, ValueError) as exc:
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(code=1)
