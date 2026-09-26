from pathlib import Path

import pytest

from autopilot.autonomous import FixProposal
from autopilot.debugging import DebuggingLoop
from autopilot.patching import PatchApplier, PatchError
from autopilot.permissions import Risk


def init_repo(path: Path):
    from autopilot.git_engine import GitEngine
    git = GitEngine(path)
    git._git("init", "-q")
    git._git("config", "user.email", "test@example.com")
    git._git("config", "user.name", "Autopilot Test")
    (path / "app.py").write_text("value = 1\n")
    (path / "pyproject.toml").write_text("[tool.pytest.ini_options]\ntestpaths=['tests']\n")
    (path / "tests").mkdir()
    (path / "tests/test_app.py").write_text("def test_value():\n    assert __import__('app').value == 2\n")
    git.add(["app.py", "pyproject.toml", "tests/test_app.py"])
    git.commit("chore: init")
    return git


def patch(old="value = 1", new="value = 2"):
    return f"--- a/app.py\n+++ b/app.py\n@@ -1 +1 @@\n-{old}\n+{new}\n"


def test_patch_requires_permission_and_checkpoint(tmp_path: Path):
    init_repo(tmp_path)
    proposal = FixProposal("fix", "test", ("app.py",), patch(), Risk.MEDIUM)
    with pytest.raises(PermissionError):
        PatchApplier(tmp_path).apply(proposal)
    with pytest.raises(PermissionError):
        PatchApplier(tmp_path).apply(proposal, allow_medium=True)
    result = PatchApplier(tmp_path).apply(proposal, allow_medium=True, approve=True)
    assert result.applied
    assert (tmp_path / "app.py").read_text() == "value = 2\n"
    assert "ai_patch_applied" in (tmp_path / ".autopilot/flight-recorder.jsonl").read_text()


def test_patch_rejects_traversal_and_secrets(tmp_path: Path):
    init_repo(tmp_path)
    applier = PatchApplier(tmp_path)
    with pytest.raises(PatchError):
        applier.validate(FixProposal("bad", "", ("../x",), "--- a/../x\n+++ b/../x\n@@ -0,0 +1 @@\n+x\n", Risk.MEDIUM))
    with pytest.raises(PatchError):
        applier.validate(FixProposal("secret", "", ("app.py",), patch(new="API_KEY = 'secret-value'"), Risk.MEDIUM))


def test_debugging_loop_rolls_back_failed_patch(tmp_path: Path):
    init_repo(tmp_path)
    proposal = FixProposal("wrong", "", ("app.py",), patch(new="value = 3"), Risk.MEDIUM)
    results = DebuggingLoop(tmp_path, max_iterations=1).run(lambda _: proposal, allow_medium=True)
    assert results[0].rolled_back
    assert (tmp_path / "app.py").read_text() == "value = 1\n"
