"""Small, testable wrapper around subprocess execution."""

from dataclasses import dataclass
import subprocess
from typing import Sequence


@dataclass(frozen=True)
class CommandResult:
    """Result of a completed command."""

    command: tuple[str, ...]
    returncode: int
    stdout: str
    stderr: str

    @property
    def ok(self) -> bool:
        return self.returncode == 0


class CommandError(RuntimeError):
    """Raised when a command exits unsuccessfully."""

    def __init__(self, result: CommandResult):
        self.result = result
        command = " ".join(result.command)
        message = result.stderr.strip() or f"command exited with {result.returncode}"
        super().__init__(f"{command}: {message}")


def run_command(
    command: Sequence[str], *, cwd: str | None = None, check: bool = True, timeout: float | None = None
) -> CommandResult:
    """Run a command without invoking a shell."""

    try:
        completed = subprocess.run(
            list(command), cwd=cwd, text=True, capture_output=True, check=False, timeout=timeout
        )
    except subprocess.TimeoutExpired as exc:
        result = CommandResult(tuple(command), 124, exc.stdout or "", f"timed out after {timeout}s")
        raise CommandError(result) from exc
    except FileNotFoundError as exc:
        result = CommandResult(tuple(command), 127, "", str(exc))
        raise CommandError(result) from exc
    result = CommandResult(
        command=tuple(command),
        returncode=completed.returncode,
        stdout=completed.stdout,
        stderr=completed.stderr,
    )
    if check and not result.ok:
        raise CommandError(result)
    return result
