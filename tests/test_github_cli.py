from typer.testing import CliRunner

from autopilot.cli import app


runner = CliRunner()


def test_github_branch_requires_high_permission(tmp_path):
    result = runner.invoke(app, ["github", "branch", "feature", "--owner", "acme", "--repo", "demo", "--path", str(tmp_path)])
    assert result.exit_code == 1
    assert "high-risk" in result.output


def test_github_ci_status_requires_token(monkeypatch):
    monkeypatch.delenv("GITHUB_TOKEN", raising=False)
    monkeypatch.delenv("GH_TOKEN", raising=False)
    result = runner.invoke(app, ["github", "ci-status", "--owner", "acme", "--repo", "demo"])
    assert result.exit_code == 1
    assert "GITHUB_TOKEN" in result.output
