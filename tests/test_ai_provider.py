import json
from pathlib import Path

from autopilot.ai import CodeReviewer, CommitMessageGenerator
from autopilot.memory import ProjectMemory
from autopilot.project_analyzer import ProjectAnalyzer
from autopilot.prompt_safety import redact_secrets
from autopilot.providers import ChatMessage, OpenAICompatibleProvider, ProviderConfig


class FakeProvider:
    def __init__(self, answer: str):
        self.answer = answer
        self.calls = []

    def complete(self, messages, *, response_format=None):
        self.calls.append((messages, response_format))
        return self.answer


def test_provider_posts_openai_compatible_payload(monkeypatch):
    seen = {}

    class Response:
        def __enter__(self): return self
        def __exit__(self, *args): pass
        def read(self): return json.dumps({"choices": [{"message": {"content": "hello"}}]}).encode()

    def fake_urlopen(request, timeout):
        seen.update(url=request.full_url, headers=dict(request.headers), body=json.loads(request.data), timeout=timeout)
        return Response()

    monkeypatch.setattr("autopilot.providers.urlopen", fake_urlopen)
    provider = OpenAICompatibleProvider(ProviderConfig("key", "https://example.test/v1", "openrouter/free"))
    assert provider.complete([ChatMessage("user", "hi")]) == "hello"
    assert seen["url"] == "https://example.test/v1/chat/completions"
    assert seen["body"]["model"] == "openrouter/free"


def test_ai_workflows_include_context_and_redact_secrets(tmp_path: Path):
    (tmp_path / "main.py").write_text("x = 1\n")
    memory = ProjectMemory(tmp_path)
    memory.add("convention", "Use small pure functions.")
    profile = ProjectAnalyzer(tmp_path).analyze()
    provider = FakeProvider("feat: improve validation")
    generator = CommitMessageGenerator(provider, profile, memory)
    assert generator.generate("+ API_KEY = 'real-secret-value'") == "feat: improve validation"
    messages, _ = provider.calls[0]
    prompt = messages[1].content
    assert "real-secret-value" not in prompt
    assert "Use small pure functions" in prompt


def test_ai_review_parses_json_and_preserves_local_findings():
    provider = FakeProvider(json.dumps({"findings": [{"severity": "medium", "title": "Missing test", "explanation": "Path lacks coverage.", "suggestion": "Add a regression test."}]}))
    findings = CodeReviewer(provider).review("+ except Exception:\n")
    assert [item.severity for item in findings] == ["MEDIUM", "MEDIUM"]
    assert findings[-1].title == "Missing test"


def test_redaction():
    assert "secret-value" not in redact_secrets("API_KEY = 'secret-value'")
