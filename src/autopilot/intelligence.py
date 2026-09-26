"""Deterministic intelligence for understanding changes before AI or Git actions."""

from dataclasses import dataclass
from pathlib import Path
import re


@dataclass(frozen=True)
class ChangeGroup:
    name: str
    files: tuple[str, ...]
    kind: str
    risk: str


class ChangeDetector:
    """Group diff file paths into logical areas without executing project code."""

    def detect(self, diff: str) -> tuple[ChangeGroup, ...]:
        paths: list[str] = []
        for line in diff.splitlines():
            if line.startswith("+++ b/"):
                paths.append(line[6:])
            elif line.startswith("+++ ") and not line.startswith("+++ /dev/null"):
                paths.append(line[4:])
        unique = sorted(set(paths))
        groups: dict[str, list[str]] = {}
        for path in unique:
            parts = Path(path).parts
            area = parts[0] if len(parts) > 1 else Path(path).name
            groups.setdefault(area, []).append(path)
        result = []
        for name, files in sorted(groups.items()):
            lowered = " ".join(files).lower()
            if any(token in lowered for token in ("test", "spec")):
                kind, risk = "tests", "low"
            elif any(token in lowered for token in ("readme", "docs", ".md")):
                kind, risk = "documentation", "low"
            elif any(token in lowered for token in ("config", ".env", "docker", "workflow", "ci")):
                kind, risk = "configuration", "medium"
            else:
                kind, risk = "source", "medium" if len(files) > 3 else "low"
            result.append(ChangeGroup(name, tuple(files), kind, risk))
        return tuple(result)

    def summary(self, diff: str) -> str:
        groups = self.detect(diff)
        if not groups:
            return "No changed files detected."
        return "; ".join(f"{group.name}: {len(group.files)} {group.kind} file(s), {group.risk} risk" for group in groups)
