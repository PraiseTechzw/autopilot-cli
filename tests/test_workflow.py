from pathlib import Path

import pytest

from autopilot.checkpoints import FlightRecorder
from autopilot.github import PullRequest
from autopilot.workflow import BoundedWatcher, ContextRecovery, DevelopmentWorkflow
from autopilot.git_engine import GitEngine, GitError


def make_repo(path: Path) -> GitEngine:
    git = GitEngine(path)
    git._git("init", "-q")
    git._git("config", "user.email", "test@example.com")
    git._git("config", "user.name", "Autopilot Test")
    (path / "pyproject.toml").write_text("[tool.pytest.ini_options]\ntestpaths=['tests']\n")
    (path / "tests").mkdir()
    (path / "tests/test_pass.py").write_text("def test_pass():\n    assert True\n")
    git.add(["pyproject.toml", "tests/test_pass.py"])
    git.commit("chore: init")
    return git


def test_context_resume_and_replay(tmp_path: Path):
    git = make_repo(tmp_path)
    (tmp_path / "app.py").write_text("value = 1\n")
    recorder = FlightRecorder(tmp_path)
    recorder.record("workflow_started", branch=git.branch())
    context = ContextRecovery(tmp_path).recover()
    assert context.branch and not context.clean
    assert recorder.replay(limit=1)[0]["event"] == "workflow_started"


def test_bounded_watcher_does_not_poll_forever():
    calls = []
    results = BoundedWatcher(iterations=3, interval=0, sleeper=lambda _: calls.append("sleep")).watch(lambda: len(calls))
    assert len(results) == 3
    assert calls == []


def test_end_to_end_workflow_requires_permissions_and_creates_pr(tmp_path: Path):
    git = make_repo(tmp_path)
    (tmp_path / "app.py").write_text("value = 2\n")
    git.add(["app.py"])

    class FakeGitHub:
        def create_pull_request(self, *args, **kwargs):
            return PullRequest(8, "Update app", "https://example/pr/8", "open", "feature", "main")

    with pytest.raises(PermissionError):
        DevelopmentWorkflow(tmp_path, github=FakeGitHub()).run(owner="acme", repo="demo", allow_medium=False, allow_high=True)
    result = DevelopmentWorkflow(tmp_path, github=FakeGitHub()).run(owner="acme", repo="demo", allow_medium=True, allow_high=True)
    assert result.phase == "pr_created"
    assert result.pull_request.number == 8
    assert "workflow_pr_created" in (tmp_path / ".autopilot/flight-recorder.jsonl").read_text()
