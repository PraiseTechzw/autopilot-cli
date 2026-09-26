from pathlib import Path

import pytest

from autopilot.autonomous import ControlledExecutor, FixProposer, TaskPlanner
from autopilot.permissions import Risk
from autopilot.project_analyzer import ProjectProfile
from autopilot.verification import VerificationCheck, VerificationResult


def test_task_planner_is_bounded_and_permission_aware():
    plan = TaskPlanner().plan("fix authentication and ship a PR")
    assert [step.action for step in plan.steps] == ["inspect", "propose", "verify", "commit", "pr"]
    assert plan.steps[-1].risk is Risk.HIGH
    assert plan.steps[-1].requires_approval


def test_fix_proposals_are_not_applied_automatically(tmp_path: Path):
    result = VerificationResult((VerificationCheck("tests", False, True, "assertion failed"),))
    proposals = FixProposer().from_verification(result)
    assert proposals[0].requires_approval
    assert not (tmp_path / "patched.py").exists()


def test_controlled_executor_limits_iterations(tmp_path: Path):
    (tmp_path / "pyproject.toml").write_text("[tool.pytest.ini_options]\ntestpaths=['tests']\n")
    (tmp_path / "tests").mkdir()
    (tmp_path / "tests/test_ok.py").write_text("def test_ok():\n    assert True\n")
    iterations = ControlledExecutor(tmp_path, max_iterations=2).verify_until_stable()
    assert len(iterations) == 1
    assert iterations[0].verification.passed


def test_controlled_executor_rejects_unapproved_actions(tmp_path: Path):
    executor = ControlledExecutor(tmp_path)
    with pytest.raises(PermissionError):
        executor.require_action("commit", Risk.MEDIUM)
