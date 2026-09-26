"""Verification planning and execution for safe development workflows."""

from dataclasses import dataclass
from pathlib import Path
import shutil

from .process import CommandResult, run_command
from .security import Finding, SecretScanner
from .test_runner import TestRun, TestRunner


@dataclass(frozen=True)
class VerificationCheck:
    name: str
    passed: bool
    required: bool
    detail: str
    result: CommandResult | None = None


@dataclass(frozen=True)
class VerificationResult:
    checks: tuple[VerificationCheck, ...]

    @property
    def passed(self) -> bool:
        return all(check.passed for check in self.checks if check.required)

    @property
    def failed(self) -> tuple[VerificationCheck, ...]:
        return tuple(check for check in self.checks if not check.passed)


class VerificationEngine:
    def __init__(self, root: str | Path = ".") -> None:
        self.root = Path(root).expanduser().resolve()

    def plan(self) -> tuple[str, ...]:
        checks = ["secrets", "tests"]
        if shutil.which("ruff") or shutil.which("flake8"):
            checks.append("lint")
        if (self.root / "mypy.ini").exists() or "mypy" in (self.root / "pyproject.toml").read_text(errors="ignore") if (self.root / "pyproject.toml").exists() else False:
            if shutil.which("mypy"):
                checks.append("types")
        return tuple(checks)

    def run(self, *, command_timeout: float | None = 120.0) -> VerificationResult:
        checks: list[VerificationCheck] = []
        findings = SecretScanner().scan(self.root)
        checks.append(VerificationCheck("secrets", not findings, True, "no likely secrets" if not findings else f"{len(findings)} likely secret(s) detected"))
        try:
            test = TestRunner(self.root).run()
            checks.append(VerificationCheck("tests", test.result.ok, True, test.result.stderr.strip()[-500:] or test.result.stdout.strip()[-500:], test.result))
        except (ValueError, OSError) as exc:
            checks.append(VerificationCheck("tests", False, True, str(exc)))
        if "lint" in self.plan():
            command = ("ruff", "check", ".") if shutil.which("ruff") else ("flake8", ".")
            result = run_command(command, cwd=str(self.root), check=False, timeout=command_timeout)
            checks.append(VerificationCheck("lint", result.ok, False, result.stderr.strip()[-500:] or result.stdout.strip()[-500:], result))
        if "types" in self.plan():
            result = run_command(("mypy", "."), cwd=str(self.root), check=False, timeout=command_timeout)
            checks.append(VerificationCheck("types", result.ok, False, result.stderr.strip()[-500:] or result.stdout.strip()[-500:], result))
        return VerificationResult(tuple(checks))
