from pathlib import Path
import os

from autopilot.config import config_template, initialize_project_config, load_config, load_env_file
from autopilot.doctor import run_checks
from autopilot.observability import EventLogger, safe
from autopilot.providers import ProviderConfig


def test_project_config_and_environment_override(tmp_path: Path, monkeypatch):
    initialize_project_config(tmp_path)
    monkeypatch.setenv("AUTOPILOT_CONFIG_DIR", str(tmp_path / "user-config"))
    monkeypatch.setenv("AI_MODEL", "test/free")
    config = load_config(tmp_path)
    assert config.ai_model == "test/free"
    assert "OPENROUTER_API_KEY" not in config_template()


def test_supported_environment_aliases_are_loaded(monkeypatch):
    monkeypatch.setenv("AUTOPILOT_DEFAULT_BASE_BRANCH", "release")
    monkeypatch.setenv("AUTOPILOT_COMMAND_TIMEOUT_SECONDS", "25")
    monkeypatch.setenv("AUTOPILOT_WATCH_INTERVAL_SECONDS", "12")
    monkeypatch.setenv("AI_API_KEY", "provider-secret")
    monkeypatch.setenv("AI_APP_TITLE", "autopilot-test")
    monkeypatch.setenv("AI_HTTP_REFERER", "https://example.com")
    monkeypatch.setenv("AI_TIMEOUT", "90")

    config = load_config()
    provider = ProviderConfig.from_env()

    assert config.default_base_branch == "release"
    assert config.command_timeout_seconds == 25.0
    assert config.watch_interval_seconds == 12.0
    assert provider is not None
    assert provider.api_key == "provider-secret"
    assert provider.app_title == "autopilot-test"
    assert provider.referer == "https://example.com"
    assert provider.timeout == 90.0


def test_dotenv_file_is_loaded_from_project_root(tmp_path: Path, monkeypatch):
    monkeypatch.delenv("AI_MODEL", raising=False)
    monkeypatch.delenv("GITHUB_TOKEN", raising=False)
    (tmp_path / ".env").write_text("AI_MODEL=project/free\nGITHUB_TOKEN=project-token\n", encoding="utf-8")

    load_env_file(tmp_path)
    config = load_config(tmp_path)

    assert config.ai_model == "project/free"
    assert os.getenv("GITHUB_TOKEN") == "project-token"


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
