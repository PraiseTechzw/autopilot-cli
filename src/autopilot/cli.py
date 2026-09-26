"""Typer application entry point and command registration layer."""

from pathlib import Path
import os

import typer

from .github import GitHubClient
from .git_engine import GitEngine
from .permissions import PermissionPolicy, Risk
from .providers import configured_provider
from .commands import CommandDeps
from .commands import local as local_commands
from .commands import automation as automation_commands
from .commands import github as github_commands

app = typer.Typer(help="Autopilot: safe automation for the software development lifecycle.")
git_app = typer.Typer(help="Inspect and operate on the current Git repository.")
github_app = typer.Typer(help="Explicit GitHub branch, pull-request, and CI operations.")
config_app = typer.Typer(help="Inspect and initialize Autopilot configuration.")
app.add_typer(git_app, name="git")
app.add_typer(github_app, name="github")
app.add_typer(config_app, name="config")


def engine(path: Path) -> GitEngine:
    """Build the Git service used by command handlers."""
    return GitEngine(path)


def provider_for(path: Path, use_ai: bool):
    """Resolve an explicitly requested AI provider, preserving CLI errors."""
    if not use_ai:
        return None
    provider = configured_provider()
    if provider is None:
        typer.echo("Error: --ai requires OPENROUTER_API_KEY or AI_API_KEY", err=True)
        raise typer.Exit(code=1)
    return provider


def github_client() -> GitHubClient:
    """Build the GitHub service from the configured environment token."""
    token = os.getenv("GITHUB_TOKEN") or os.getenv("GH_TOKEN")
    if not token:
        typer.echo("Error: set GITHUB_TOKEN or GH_TOKEN before using GitHub commands", err=True)
        raise typer.Exit(code=1)
    return GitHubClient(token, os.getenv("GITHUB_API_URL", "https://api.github.com"))


def require_high_permission(allow_high: bool, action: str) -> None:
    """Apply the shared high-risk permission gate."""
    PermissionPolicy(allow_high=allow_high).require(Risk.HIGH, action)


@app.callback()
def main() -> None:
    """Autopilot developer workflow agent."""


# Keep these imports available from autopilot.cli for callers that imported
# handlers before the command modules were split.
version = local_commands.version
doctor = local_commands.doctor
config_show = local_commands.config_show
config_init = local_commands.config_init
events = local_commands.events
status = local_commands.status
analyze = local_commands.analyze
changes = local_commands.changes
verify = local_commands.verify
test_project = local_commands.test_project
scan = local_commands.scan
commit_message = local_commands.commit_message
review = local_commands.review
commit = local_commands.commit
checkpoint = local_commands.checkpoint
remember = local_commands.remember
memory = local_commands.memory
git_status = local_commands.git_status
git_diff = local_commands.git_diff
git_log = local_commands.git_log
plan = automation_commands.plan
iterate = automation_commands.iterate
apply_fix = automation_commands.apply_fix
undo = automation_commands.undo
debug = automation_commands.debug
propose_fix = automation_commands.propose_fix
execute_task = automation_commands.execute_task
resume = automation_commands.resume
replay = automation_commands.replay
watch = automation_commands.watch
ci_analyze = automation_commands.ci_analyze
workflow = automation_commands.workflow
github_branch = github_commands.branch
github_pr_create = github_commands.pr_create
github_ci_status = github_commands.ci_status


deps = CommandDeps(engine=engine, provider_for=provider_for, github_client=github_client, require_high_permission=require_high_permission)
local_commands.register(app, git_app, config_app, deps)
automation_commands.register(app, deps)
github_commands.register(github_app, deps)


if __name__ == "__main__":
    app()
