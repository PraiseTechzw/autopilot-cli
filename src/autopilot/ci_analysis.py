"""CI failure analysis that is read-only and safe to replay."""

from dataclasses import dataclass
import io
import re
import zipfile

from .ai import ReviewFinding
from .github import GitHubClient, GitHubError, WorkflowRun
from .memory import ProjectMemory
from .prompt_safety import redact_secrets
from .project_analyzer import ProjectProfile
from .providers import AIProvider, ChatMessage


@dataclass(frozen=True)
class CIFailureReport:
    run: WorkflowRun
    failed_lines: tuple[str, ...]
    suspected_files: tuple[str, ...]
    explanation: str
    findings: tuple[ReviewFinding, ...]
    category: str = "unknown"
    confidence: str = "low"
    reproduction_command: str = ""


class CIFailureAnalyzer:
    def __init__(self, github: GitHubClient, provider: AIProvider | None = None, profile: ProjectProfile | None = None, memory: ProjectMemory | None = None) -> None:
        self.github, self.provider, self.profile, self.memory = github, provider, profile, memory

    def analyze(self, owner: str, repo: str, run: WorkflowRun) -> CIFailureReport:
        if run.successful or not run.completed:
            raise ValueError("CI failure analysis requires a completed unsuccessful workflow run")
        archive = self.github.download_workflow_run_logs(owner, repo, run.run_id)
        text = self._extract_logs(archive)
        lines = tuple(line.strip() for line in text.splitlines() if re.search(r"(?i)(error|failed|failure|exception|traceback)", line))[-30:]
        files = tuple(sorted(set(re.findall(r"(?:^|[ (])([\w./-]+\.(?:py|js|ts|go|rs|java|rb))(?::\d+)?", text))))
        explanation = "\n".join(lines) or "The workflow failed without a recognizable error line."
        lowered = explanation.lower()
        category = "test" if any(word in lowered for word in ("assert", "pytest", "test failed")) else "dependency" if any(word in lowered for word in ("module not found", "dependency", "package")) else "build" if any(word in lowered for word in ("compile", "syntax", "build")) else "runtime" if any(word in lowered for word in ("exception", "traceback", "error")) else "unknown"
        confidence = "high" if lines and files else "medium" if lines else "low"
        reproduction = "python -m pytest" if category == "test" else "inspect the failed CI command"
        findings = (ReviewFinding("HIGH", "CI workflow failed", explanation[:1000], "Inspect the suspected files and reproduce the failing command locally."),)
        if self.provider:
            context = ""
            if self.profile:
                context += f"Project languages: {', '.join(self.profile.languages)}; tests: {', '.join(self.profile.test_frameworks)}.\n"
            if self.memory:
                context += "\n".join(f"{item.category}: {item.content}" for item in self.memory.entries()[-10:])
            prompt = "Analyze this failed CI log. Return a concise root-cause explanation and safe next debugging steps. Do not propose executing commands automatically.\n\n" + context + "\nLOG:\n" + redact_secrets(text[-12000:])
            explanation = self.provider.complete([ChatMessage("system", "You are a careful CI diagnostician."), ChatMessage("user", prompt)])[:2000]
        return CIFailureReport(run, lines, files, explanation, findings, category, confidence, reproduction)

    @staticmethod
    def _extract_logs(archive: bytes) -> str:
        if not archive:
            return ""
        try:
            with zipfile.ZipFile(io.BytesIO(archive)) as bundle:
                return "\n".join(bundle.read(name).decode(errors="replace") for name in bundle.namelist() if not name.endswith("/"))
        except zipfile.BadZipFile:
            return archive.decode(errors="replace")
