"""AI workflows for commit messages and code review.

All provider calls are read-only. Code changes and Git actions remain outside this module.
"""

from dataclasses import dataclass
import json
import re
from typing import Any

from .memory import ProjectMemory
from .project_analyzer import ProjectProfile
from .prompt_safety import redact_secrets
from .providers import AIProvider, ChatMessage
from .intelligence import ChangeDetector


@dataclass(frozen=True)
class ReviewFinding:
    severity: str
    title: str
    explanation: str
    suggestion: str


def _context(profile: ProjectProfile | None, memory: ProjectMemory | None, diff: str = "", max_chars: int = 9000) -> str:
    parts: list[str] = []
    if profile:
        parts.append(f"Project languages: {', '.join(profile.languages) or 'unknown'}; frameworks: {', '.join(profile.frameworks) or 'none detected'}; tests: {', '.join(profile.test_frameworks) or 'unknown'}. Architecture areas: {', '.join(profile.architecture) or 'unknown'}. Entrypoints: {', '.join(profile.entrypoints) or 'none detected'}. Dependencies: {', '.join(profile.dependencies[:30]) or 'none detected'}. Conventions: {', '.join(profile.conventions) or 'none detected'}.")
    if memory:
        entries = memory.relevant(diff, limit=10) if diff else memory.entries()[-10:]
        if not entries:
            entries = memory.entries()[-10:]
        if entries:
            parts.append("Project memory:\n" + "\n".join(f"- {item.category}: {item.content}" for item in entries[-20:]))
    if diff:
        parts.append("Change map: " + ChangeDetector().summary(diff))
    return "\n".join(parts)[:max_chars]


class CommitMessageGenerator:
    def __init__(self, provider: AIProvider | None = None, profile: ProjectProfile | None = None, memory: ProjectMemory | None = None) -> None:
        self.provider, self.profile, self.memory = provider, profile, memory

    def generate(self, diff: str) -> str:
        if self.provider:
            prompt = "Generate one Conventional Commit message for this diff. Return only type(scope): imperative summary, max 72 characters. Do not mention secrets or invent details.\n\n" + _context(self.profile, self.memory, diff) + "\n\nDIFF:\n" + redact_secrets(diff)
            answer = self.provider.complete([ChatMessage("system", "You are a precise release engineer."), ChatMessage("user", prompt)])
            return answer.splitlines()[0].strip(" `\"")[:72]
        lowered = diff.lower()
        if "password" in lowered or "token" in lowered or "auth" in lowered or "api_key" in lowered or "api-key" in lowered:
            return "feat(auth): update authentication flow"
        if re.search(r"\+.*test", diff, re.IGNORECASE):
            return "test: update automated coverage"
        if any(line.startswith("+") and "readme" in line.lower() for line in diff.splitlines()):
            return "docs: update project documentation"
        return "chore: update project files"


class PRSummaryGenerator:
    """Generate a concise PR title/body without authorizing any GitHub action."""

    def __init__(self, provider: AIProvider | None = None, profile: ProjectProfile | None = None, memory: ProjectMemory | None = None) -> None:
        self.provider, self.profile, self.memory = provider, profile, memory

    def generate(self, diff: str, commit_message: str | None = None) -> tuple[str, str]:
        if self.provider:
            prompt = "Generate a pull request title and body for this diff. Return ONLY JSON with keys title and body. Body must include Summary and Testing headings, and must not invent tests or secrets.\n\n" + _context(self.profile, self.memory, diff) + "\nCommit message: " + (commit_message or "none") + "\nDIFF:\n" + redact_secrets(diff)
            answer = self.provider.complete([ChatMessage("system", "You write accurate, conservative pull requests."), ChatMessage("user", prompt)], response_format={"type": "json_object"})
            try:
                raw = answer.strip().removeprefix("```").removeprefix("json").removesuffix("```").strip()
                data = json.loads(raw)
                title, body = str(data["title"]).strip(), str(data["body"]).strip()
                if title and body:
                    return title[:120], body
            except (json.JSONDecodeError, KeyError, TypeError, ValueError):
                pass
        title = commit_message or CommitMessageGenerator().generate(diff)
        changed = sum(1 for line in diff.splitlines() if line.startswith("+") and not line.startswith("+++"))
        body = f"## Summary\n- {title}\n\n## Testing\n- Not run by Autopilot (inspect CI status before merging).\n\nChanged added lines: {changed}."
        return title[:120], body


class CodeReviewer:
    def __init__(self, provider: AIProvider | None = None, profile: ProjectProfile | None = None, memory: ProjectMemory | None = None) -> None:
        self.provider, self.profile, self.memory = provider, profile, memory

    def review(self, diff: str) -> tuple[ReviewFinding, ...]:
        local = self._local_review(diff)
        if not self.provider:
            return local
        prompt = "Review this diff for bugs, security, correctness, performance, maintainability, and missing tests. Return ONLY a JSON array of objects with keys severity (LOW/MEDIUM/HIGH), title, explanation, suggestion. Return [] if no findings.\n\n" + _context(self.profile, self.memory, diff) + "\n\nDIFF:\n" + redact_secrets(diff)
        answer = self.provider.complete([ChatMessage("system", "You are a conservative senior code reviewer."), ChatMessage("user", prompt)], response_format={"type": "json_object"})
        try:
            raw = answer.strip()
            if raw.startswith("```"):
                raw = raw.split("\n", 1)[1].rsplit("```", 1)[0]
            parsed: Any = json.loads(raw)
            if isinstance(parsed, dict):
                parsed = parsed.get("findings", [])
            if not isinstance(parsed, list):
                raise ValueError
            remote = tuple(ReviewFinding(str(item["severity"]).upper(), str(item["title"]), str(item["explanation"]), str(item["suggestion"])) for item in parsed if isinstance(item, dict))
        except (ValueError, TypeError, KeyError, json.JSONDecodeError):
            remote = (ReviewFinding("MEDIUM", "AI review returned unstructured output", answer[:500], "Review the provider response manually before acting."),)
        return local + remote

    @staticmethod
    def _local_review(diff: str) -> tuple[ReviewFinding, ...]:
        findings: list[ReviewFinding] = []
        if re.search(r"(?i)(api[_-]?key|password|secret|token)\s*[:=]", diff):
            findings.append(ReviewFinding("HIGH", "Possible credential in diff", "A credential-like assignment appears in the proposed changes.", "Remove the value and load it from a secret manager or environment."))
        if "except Exception:" in diff:
            findings.append(ReviewFinding("MEDIUM", "Broad exception handling", "Catching every exception can hide programming errors.", "Catch the expected exception types and preserve context."))
        return tuple(findings)
