from pathlib import Path

from autopilot.intelligence import ChangeDetector
from autopilot.verification import VerificationEngine


def test_change_detector_groups_files_and_risk():
    diff = """diff --git a/src/auth.py b/src/auth.py\n+++ b/src/auth.py\n+ x\ndiff --git a/tests/test_auth.py b/tests/test_auth.py\n+++ b/tests/test_auth.py\n+ y\ndiff --git a/README.md b/README.md\n+++ b/README.md\n+ z\n"""
    groups = ChangeDetector().detect(diff)
    assert {group.name for group in groups} == {"README.md", "src", "tests"}
    assert next(group for group in groups if group.name == "tests").kind == "tests"


def test_verification_plan_and_result_for_project(tmp_path: Path):
    (tmp_path / "pyproject.toml").write_text("[tool.pytest.ini_options]\ntestpaths=['tests']\n")
    (tmp_path / "tests").mkdir()
    (tmp_path / "tests/test_ok.py").write_text("def test_ok():\n    assert True\n")
    result = VerificationEngine(tmp_path).run()
    assert result.passed
    assert {check.name for check in result.checks} >= {"secrets", "tests"}
