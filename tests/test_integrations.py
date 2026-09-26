from pathlib import Path

import pytest

from autopilot.ai import CodeReviewer, CommitMessageGenerator
from autopilot.github import GitHubClient
from autopilot.permissions import PermissionPolicy, Risk


def test_commit_generator_and_reviewer() -> None:
    diff = "+ API_KEY = 'secret-value'\n+ except Exception:\n"
    assert CommitMessageGenerator().generate(diff).startswith("feat(auth):")
    findings = CodeReviewer().review(diff)
    assert [finding.severity for finding in findings] == ["HIGH", "MEDIUM"]


def test_permission_policy_requires_explicit_medium_and_high_access() -> None:
    policy = PermissionPolicy()
    assert policy.permits(Risk.LOW)
    with pytest.raises(PermissionError):
        policy.require(Risk.MEDIUM, "commit")
    PermissionPolicy(allow_medium=True).require(Risk.MEDIUM, "commit")


def test_github_create_pull_request_with_mocked_request(monkeypatch) -> None:
    client = GitHubClient("token", api_url="https://example.test")
    seen = {}

    def fake_request(method, endpoint, payload=None):
        seen.update(method=method, endpoint=endpoint, payload=payload)
        return {"number": 7, "title": "Add feature", "html_url": "https://github.test/pr/7", "state": "open"}

    monkeypatch.setattr(client, "_request", fake_request)
    pr = client.create_pull_request("acme", "demo", "Add feature", "Details", "feature")
    assert pr.number == 7
    assert seen["endpoint"] == "/repos/acme/demo/pulls"
    assert seen["payload"]["base"] == "main"
