from pathlib import Path
import json

from autopilot.task_context import CodebaseContextBuilder
from autopilot.task_execution import TaskExecutor
from autopilot.git_engine import GitEngine


def init_repo(path: Path):
    git = GitEngine(path)
    git._git("init", "-q")
    git._git("config", "user.email", "test@example.com")
    git._git("config", "user.name", "Autopilot Test")
    (path / "pyproject.toml").write_text("[tool.pytest.ini_options]\ntestpaths=['tests']\n")
    (path / "app.py").write_text("value = 1\n")
    (path / "tests").mkdir()
    (path / "tests/test_app.py").write_text("def test_value():\n    assert __import__('app').value == 2\n")
    git.add(["pyproject.toml", "app.py", "tests/test_app.py"])
    git.commit("chore: init")
    return git


class FakeProvider:
    def __init__(self):
        self.calls = 0

    def complete(self, messages, *, response_format=None):
        self.calls += 1
        if self.calls == 1:
            return json.dumps({"steps": [{"id": "inspect", "action": "inspect", "description": "inspect", "risk": "low", "requires_approval": False}, {"id": "propose", "action": "propose", "description": "patch", "risk": "medium", "requires_approval": True}, {"id": "verify", "action": "verify", "description": "test", "risk": "low", "requires_approval": False}]})
        return json.dumps({"title": "Set app value", "rationale": "Satisfy the requested behavior.", "files": ["app.py"], "risk": "medium", "patch": "--- a/app.py\n+++ b/app.py\n@@ -1 +1 @@\n-value = 1\n+value = 2\n"})


def test_context_includes_entrypoints_and_relevant_files(tmp_path: Path):
    init_repo(tmp_path)
    context = CodebaseContextBuilder(tmp_path).build("change app value")
    assert "app.py" in context.files
    assert "Architecture:" in context.render()


def test_task_executor_applies_and_verifies_multi_step_task(tmp_path: Path):
    init_repo(tmp_path)
    result = TaskExecutor(tmp_path, provider=FakeProvider(), max_iterations=2).execute("change app value", approve=True, allow_medium=True)
    assert result.verification.passed
    assert result.patch.files == ("app.py",)
    assert (tmp_path / "app.py").read_text() == "value = 2\n"
    assert "task_execution_completed" in (tmp_path / ".autopilot/flight-recorder.jsonl").read_text()
