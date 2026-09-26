"""Project test discovery and execution."""

from dataclasses import dataclass
from pathlib import Path

from .process import CommandResult, run_command


@dataclass(frozen=True)
class TestRun:
    command: tuple[str, ...]
    result: CommandResult


class TestRunner:
    __test__ = False

    def __init__(self, root: str | Path = ".") -> None:
        self.root = Path(root).expanduser().resolve()

    def discover(self) -> tuple[str, ...]:
        if (self.root / "pyproject.toml").exists() or (self.root / "pytest.ini").exists() or (self.root / "tests").is_dir():
            return ("python", "-m", "pytest")
        if (self.root / "package.json").exists():
            return ("npm", "test")
        if (self.root / "go.mod").exists():
            return ("go", "test", "./...")
        return ()

    def run(self, command: tuple[str, ...] | None = None) -> TestRun:
        selected = command or self.discover()
        if not selected:
            raise ValueError("no supported test command detected")
        return TestRun(selected, run_command(selected, cwd=str(self.root), check=False))
