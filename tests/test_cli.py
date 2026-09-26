from typer.testing import CliRunner
import json

from autopilot.cli import app


runner = CliRunner()


def test_version() -> None:
    result = runner.invoke(app, ["version"])
    assert result.exit_code == 0
    assert result.stdout.strip() == "1.1.0"


def test_help() -> None:
    result = runner.invoke(app, ["--help"])
    assert result.exit_code == 0
    assert "Autopilot" in result.stdout


def test_status_outside_repository(tmp_path) -> None:
    result = runner.invoke(app, ["status", "--path", str(tmp_path)])
    assert result.exit_code == 1
    assert "not a Git repository" in result.output


def test_status_json(tmp_path) -> None:
    from autopilot.git_engine import GitEngine
    git = GitEngine(tmp_path)
    git._git("init", "-q")
    git._git("config", "user.email", "test@example.com")
    git._git("config", "user.name", "Autopilot Test")
    (tmp_path / "README.md").write_text("status\n")
    git.add(["README.md"])
    git.commit("chore: init")
    result = runner.invoke(app, ["status", "--path", str(tmp_path), "--json"])
    assert result.exit_code == 0
    assert json.loads(result.stdout)["clean"] is True


def test_status_json_dirty_has_plain_entries(tmp_path) -> None:
    from autopilot.git_engine import GitEngine
    git = GitEngine(tmp_path)
    git._git("init", "-q")
    git._git("config", "user.email", "test@example.com")
    git._git("config", "user.name", "Autopilot Test")
    (tmp_path / "README.md").write_text("status\n")
    git.add(["README.md"])
    git.commit("chore: init")
    (tmp_path / "README.md").write_text("changed\n")
    result = runner.invoke(app, ["status", "--path", str(tmp_path), "--json"])
    payload = json.loads(result.stdout)
    assert payload["clean"] is False
    assert "\u001b" not in result.stdout
