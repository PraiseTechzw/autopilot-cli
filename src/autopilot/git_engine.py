"""Git operations used by the CLI and future workflow agents."""

from dataclasses import dataclass
from pathlib import Path

from .process import CommandError, CommandResult, run_command


class GitError(RuntimeError):
    """Raised for invalid repository operations."""


@dataclass(frozen=True)
class GitStatus:
    branch: str
    clean: bool
    entries: tuple[str, ...]


class GitEngine:
    """A small Git facade that keeps command construction in one place."""

    def __init__(self, path: str | Path = ".", *, timeout: float | None = 120.0) -> None:
        self.path = Path(path).expanduser().resolve()
        self.timeout = timeout

    def _git(self, *args: str, check: bool = True) -> CommandResult:
        try:
            return run_command(("git", *args), cwd=str(self.path), check=check, timeout=self.timeout)
        except (CommandError, OSError) as exc:
            raise GitError(f"unable to run git: {exc}") from exc

    def is_repository(self) -> bool:
        result = self._git("rev-parse", "--is-inside-work-tree", check=False)
        return result.ok and result.stdout.strip() == "true"

    def require_repository(self) -> None:
        if not self.is_repository():
            raise GitError(f"not a Git repository: {self.path}")

    def branch(self) -> str:
        self.require_repository()
        return self._git("branch", "--show-current").stdout.strip() or "HEAD"

    def status(self) -> GitStatus:
        self.require_repository()
        result = self._git("status", "--short")
        entries = tuple(line for line in result.stdout.splitlines() if line)
        return GitStatus(branch=self.branch(), clean=not entries, entries=entries)

    def diff(self, staged: bool = False) -> str:
        self.require_repository()
        return self._git("diff", *("--cached",) if staged else ()).stdout

    def add(self, paths: list[str]) -> None:
        self.require_repository()
        if not paths:
            raise GitError("at least one path is required")
        self._git("add", "--", *paths)

    def commit(self, message: str) -> str:
        self.require_repository()
        message = message.strip()
        if not message:
            raise GitError("commit message cannot be empty")
        return self._git("commit", "-m", message).stdout

    def log(self, limit: int = 10) -> str:
        self.require_repository()
        if limit < 1:
            raise GitError("log limit must be positive")
        return self._git("log", f"-{limit}", "--oneline", "--decorate").stdout

    def create_branch(self, name: str, checkout: bool = True) -> None:
        self.require_repository()
        if not name.strip() or name.startswith("-"):
            raise GitError("invalid branch name")
        self._git("switch", "-c" if checkout else "--create", name)

    def pull_rebase(self, remote: str = "origin", branch: str | None = None) -> str:
        self.require_repository()
        args = ["pull", "--rebase", remote]
        if branch:
            args.append(branch)
        return self._git(*args).stdout

    def push(self, remote: str = "origin", branch: str | None = None, set_upstream: bool = False) -> str:
        self.require_repository()
        args = ["push"]
        if set_upstream:
            args.extend(["--set-upstream"])
        args.append(remote)
        if branch:
            args.append(branch)
        return self._git(*args).stdout
