from typer.testing import CliRunner

from autopilot.cli import app


runner = CliRunner()


def test_version() -> None:
    result = runner.invoke(app, ["version"])
    assert result.exit_code == 0
    assert result.stdout.strip() == "0.9.0"


def test_help() -> None:
    result = runner.invoke(app, ["--help"])
    assert result.exit_code == 0
    assert "Autopilot" in result.stdout


def test_status_outside_repository(tmp_path) -> None:
    result = runner.invoke(app, ["status", "--path", str(tmp_path)])
    assert result.exit_code == 1
    assert "not a Git repository" in result.output
