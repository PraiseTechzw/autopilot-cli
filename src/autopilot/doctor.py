"""Read-only installation and environment diagnostics."""

from dataclasses import dataclass
import os
from pathlib import Path
import platform
import shutil
import sys

from .config import AppConfig, load_config
from .git_engine import GitEngine


@dataclass(frozen=True)
class Check:
    name: str
    ok: bool
    detail: str
    required: bool = True


def run_checks(root: str | Path = ".") -> tuple[Check, ...]:
    path = Path(root).expanduser().resolve()
    try:
        config = load_config(path)
        config_check = Check("configuration", True, f"loaded from {config.source}")
    except Exception as exc:
        config_check = Check("configuration", False, str(exc))
    git_ok = shutil.which("git") is not None
    repo_ok = False
    if git_ok:
        repo_ok = GitEngine(path).is_repository()
    return (
        Check("python", sys.version_info >= (3, 11), platform.python_version()),
        Check("git executable", git_ok, shutil.which("git") or "not found"),
        Check("repository", repo_ok, str(path), required=False),
        config_check,
        Check("AI provider", bool(os.getenv("OPENROUTER_API_KEY") or os.getenv("AI_API_KEY")), "configured" if (os.getenv("OPENROUTER_API_KEY") or os.getenv("AI_API_KEY")) else "not configured", required=False),
        Check("GitHub token", bool(os.getenv("GITHUB_TOKEN") or os.getenv("GH_TOKEN")), "configured" if (os.getenv("GITHUB_TOKEN") or os.getenv("GH_TOKEN")) else "not configured", required=False),
    )
