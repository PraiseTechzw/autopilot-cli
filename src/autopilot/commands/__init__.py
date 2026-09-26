"""Typer command groups kept separate from the application entry point."""

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable


@dataclass(frozen=True)
class CommandDeps:
    """Narrow boundary from command handlers to CLI-level integration helpers."""

    engine: Callable[[Path], Any]
    provider_for: Callable[[Path, bool], Any]
    github_client: Callable[[], Any]
    require_high_permission: Callable[[bool, str], None]
