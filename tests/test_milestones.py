from pathlib import Path

from autopilot.checkpoints import CheckpointManager, FlightRecorder
from autopilot.project_analyzer import ProjectAnalyzer
from autopilot.security import SecretScanner
from autopilot.test_runner import TestRunner


def test_project_analyzer_detects_python_project(tmp_path: Path) -> None:
    (tmp_path / "pyproject.toml").write_text("[project]\ndependencies=['fastapi']\n")
    (tmp_path / "main.py").write_text("print('x')\n")
    (tmp_path / "tests").mkdir()
    profile = ProjectAnalyzer(tmp_path).analyze()
    assert profile.languages == ("Python",)
    assert profile.package_managers == ("pip",)
    assert profile.frameworks == ("FastAPI",)
    assert profile.test_frameworks == ("pytest",)


def test_test_runner_discovers_pytest(tmp_path: Path) -> None:
    (tmp_path / "pyproject.toml").write_text("")
    assert TestRunner(tmp_path).discover() == ("python", "-m", "pytest")


def test_secret_scanner_finds_secret_but_skips_example(tmp_path: Path) -> None:
    (tmp_path / "config.py").write_text("API_KEY = '1234567890abcdef'\n")
    (tmp_path / ".env.example").write_text("API_KEY='1234567890abcdef'\n")
    findings = SecretScanner().scan(tmp_path)
    assert len(findings) == 1
    assert findings[0].path == "config.py"


def test_checkpoint_records_current_revision(tmp_path: Path) -> None:
    git = __import__("autopilot.git_engine", fromlist=["GitEngine"]).GitEngine(tmp_path)
    git._git("init", "-q")
    git._git("config", "user.email", "test@example.com")
    git._git("config", "user.name", "Autopilot Test")
    (tmp_path / "a.txt").write_text("a")
    git.add(["a.txt"])
    git.commit("chore: init")
    point = CheckpointManager(tmp_path).create("before-change")
    assert point.commit
    assert "checkpoint_created" in (tmp_path / ".autopilot" / "flight-recorder.jsonl").read_text()
