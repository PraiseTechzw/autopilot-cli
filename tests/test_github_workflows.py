import json
from urllib.error import URLError

from autopilot.ai import PRSummaryGenerator
from autopilot.github import GitHubClient, GitHubError


def test_github_branch_and_pr_and_ci_operations(monkeypatch):
    client = GitHubClient("token", api_url="https://example.test")
    calls = []

    def fake_request(method, endpoint, payload=None):
        calls.append((method, endpoint, payload))
        if endpoint.endswith("/git/refs"):
            return {"url": "https://api/refs/7", "object": {"sha": "abc"}}
        if "/actions/runs" in endpoint:
            return {"workflow_runs": [{"id": 1, "name": "CI", "head_branch": "feature", "status": "completed", "conclusion": "success", "html_url": "https://run/1", "head_sha": "abc"}]}
        return {"number": 3, "title": "Feature", "html_url": "https://pr/3", "state": "open", "head": {"ref": "feature"}, "base": {"ref": "main"}}

    monkeypatch.setattr(client, "_request", fake_request)
    branch = client.create_branch("acme", "demo", "feature", "abc")
    pr = client.create_pull_request("acme", "demo", "Feature", "body", "feature")
    runs = client.workflow_runs("acme", "demo", branch="feature")
    assert branch.sha == "abc"
    assert pr.number == 3 and pr.head == "feature"
    assert runs[0].successful
    assert "branch=feature" in calls[-1][1]


def test_pr_summary_provider_and_fallback():
    class Provider:
        def complete(self, messages, *, response_format=None):
            return json.dumps({"title": "Add validation", "body": "## Summary\n- Adds validation\n\n## Testing\n- pytest"})

    title, body = PRSummaryGenerator(Provider()).generate("+ validate()")
    assert title == "Add validation"
    assert "## Testing" in body
    fallback_title, fallback_body = PRSummaryGenerator().generate("+ x = 1")
    assert fallback_title.startswith("chore:")
    assert "Not run" in fallback_body


def test_github_transport_failure_becomes_safe_domain_error(monkeypatch):
    monkeypatch.setattr("autopilot.github.urlopen", lambda *args, **kwargs: (_ for _ in ()).throw(URLError("offline")))
    client = GitHubClient("token")
    try:
        client.workflow_runs("acme", "demo")
    except GitHubError as exc:
        assert "request failed" in str(exc)
    else:
        raise AssertionError("expected GitHubError")
