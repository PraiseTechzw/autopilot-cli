from pathlib import Path

from autopilot.config import config_template, initialize_project_config, load_config
from autopilot.doctor import run_checks
from autopilot.observability import EventLogger, safe


def test_project_config_and_environment_override(tmp_path: Path, monkeypatch):
    initialize_project_config(tmp_path)
    monkeypatch.setenv("AUTOPILOT_CONFIG_DIR", str(tmp_path / "user-config"))
    monkeypatch.setenv("AI_MODEL", "test/free")
    config = load_config(tmp_path)
    assert config.ai_model == "test/free"
    assert "OPENROUTER_API_KEY" not in config_template()


def test_observability_redacts_secrets(tmp_path: Path):
    assert "secret-value" not in safe("token=secret-value")
    logger = EventLogger(tmp_path)
    logger.emit("test", token="secret-value", status="ok")
    events = logger.read()
    assert events[0]["token"] == "[REDACTED]"
    assert events[0]["status"] == "ok"


def test_doctor_is_read_only_and_reports_platform(tmp_path: Path):
    checks = run_checks(tmp_path)
    names = {item.name for item in checks}
    assert {"python", "git executable", "configuration"} <= names
    assert not (tmp_path / ".autopilot").exists()
