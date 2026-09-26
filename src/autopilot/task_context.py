"""Context assembly for task-to-code execution with bounded, secret-redacted inputs."""

from dataclasses import dataclass
from pathlib import Path
import re

from .intelligence import ChangeDetector
from .memory import ProjectMemory
from .project_analyzer import ProjectAnalyzer, ProjectProfile
from .prompt_safety import redact_secrets


@dataclass(frozen=True)
class CodebaseContext:
    profile: ProjectProfile
    files: tuple[str, ...]
    excerpts: tuple[tuple[str, str], ...]
    memory: tuple[str, ...]
    change_summary: str

    def render(self, limit: int = 14000) -> str:
        parts = [
            f"Project languages: {', '.join(self.profile.languages) or 'unknown'}",
            f"Architecture: {', '.join(self.profile.architecture) or 'unknown'}",
            f"Dependencies: {', '.join(self.profile.dependencies) or 'none detected'}",
            f"Entrypoints: {', '.join(self.profile.entrypoints) or 'none detected'}",
            f"Changed areas: {self.change_summary}",
        ]
        if self.memory:
            parts.append("Relevant memory:\n" + "\n".join(f"- {item}" for item in self.memory))
        if self.excerpts:
            parts.append("Relevant files:\n" + "\n\n".join(f"--- {name} ---\n{text}" for name, text in self.excerpts))
        return redact_secrets("\n".join(parts))[:limit]


class CodebaseContextBuilder:
    def __init__(self, root: str | Path = ".", *, max_files: int = 24, max_file_chars: int = 3000) -> None:
        if max_files < 1 or max_files > 100:
            raise ValueError("max_files must be between 1 and 100")
        self.root = Path(root).expanduser().resolve()
        self.max_files, self.max_file_chars = max_files, max_file_chars

    def build(self, task: str = "", *, diff: str = "") -> CodebaseContext:
        profile = ProjectAnalyzer(self.root).analyze()
        all_files = [p for p in self.root.rglob("*") if p.is_file() and not any(part in {".git", ".autopilot", ".venv", "node_modules", "__pycache__"} for part in p.relative_to(self.root).parts)]
        terms = {term.lower() for term in re.findall(r"[A-Za-z][\w-]+", task) if len(term) > 2}
        scored: list[tuple[int, Path]] = []
        for path in all_files:
            relative = str(path.relative_to(self.root))
            score = 0
            lowered = relative.lower()
            score += sum(term in lowered for term in terms) * 5
            score += 4 if path.name in profile.entrypoints else 0
            score += 3 if relative in profile.important_files else 0
            score += 2 if path.suffix in {".py", ".js", ".ts", ".go", ".rs", ".java", ".rb"} else 0
            scored.append((score, path))
        scored.sort(key=lambda item: (-item[0], str(item[1])))
        excerpts: list[tuple[str, str]] = []
        for _, path in scored[: self.max_files]:
            try:
                text = path.read_text(errors="ignore")
            except OSError:
                continue
            if "\x00" in text:
                continue
            excerpts.append((str(path.relative_to(self.root)), redact_secrets(text[: self.max_file_chars])))
        memory = ProjectMemory(self.root)
        relevant = memory.relevant(task, limit=10) if task else memory.entries()[-10:]
        memory_text = tuple(f"{item.category}: {item.content}" for item in relevant)
        return CodebaseContext(profile, tuple(str(path.relative_to(self.root)) for _, path in scored[: self.max_files]), tuple(excerpts), memory_text, ChangeDetector().summary(diff) if diff else "no active diff")
