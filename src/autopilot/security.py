"""Lightweight secret scanner for pre-commit safety checks."""

from dataclasses import dataclass
from pathlib import Path
import re


@dataclass(frozen=True)
class Finding:
    path: str
    line: int
    kind: str
    excerpt: str


class SecretScanner:
    PATTERNS = (("private key", re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----")), ("AWS access key", re.compile(r"\bAKIA[0-9A-Z]{16}\b")), ("generic secret assignment", re.compile(r"(?i)\b(api[_-]?key|secret|password|token)\s*[:=]\s*['\"][^'\"]{8,}['\"]")))
    SKIP_DIRS = {".git", ".venv", "venv", "node_modules", "__pycache__"}

    def scan(self, root: str | Path = ".") -> tuple[Finding, ...]:
        base = Path(root).expanduser().resolve()
        findings: list[Finding] = []
        for path in base.rglob("*"):
            if not path.is_file() or any(part in self.SKIP_DIRS for part in path.relative_to(base).parts):
                continue
            try:
                lines = path.read_text(errors="ignore").splitlines()
            except OSError:
                continue
            for number, line in enumerate(lines, 1):
                for kind, pattern in self.PATTERNS:
                    if pattern.search(line) and not path.name.endswith((".example", ".sample")):
                        findings.append(Finding(str(path.relative_to(base)), number, kind, line.strip()[:160]))
        return tuple(findings)
