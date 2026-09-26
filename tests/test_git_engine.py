from pathlib import Path

import pytest

from autopilot.git_engine import GitEngine, GitError


def init_repo(path: Path) -> GitEngine:
    git = GitEngine(path)
    git._git("init", "-q")
    git._git("config", "user.email", "test@example.com")
    git._git("config", "user.name", "Autopilot Test")
    return git


def test_status_reports_clean_and_changed_states(tmp_path: Path) -> None:
    git = init_repo(tmp_path)
    clean = git.status()
    assert clean.clean
    assert clean.branch in {"master", "main"}

    (tmp_path / "hello.txt").write_text("hello\n")
    changed = git.status()
    assert not changed.clean
    assert any("hello.txt" in entry for entry in changed.entries)


def test_add_commit_and_log(tmp_path: Path) -> None:
    git = init_repo(tmp_path)
    (tmp_path / "hello.txt").write_text("hello\n")
    git.add(["hello.txt"])
    output = git.commit("chore: add greeting")
    assert "chore: add greeting" in output
    assert "chore: add greeting" in git.log(limit=1)
    assert git.status().clean


def test_rejects_empty_commit_message(tmp_path: Path) -> None:
    git = init_repo(tmp_path)
    with pytest.raises(GitError, match="cannot be empty"):
        git.commit(" ")


def test_rejects_non_repository(tmp_path: Path) -> None:
    with pytest.raises(GitError, match="not a Git repository"):
        GitEngine(tmp_path).status()


def test_diff_can_read_staged_changes(tmp_path: Path) -> None:
    git = init_repo(tmp_path)
    (tmp_path / "hello.txt").write_text("hello\n")
    git.add(["hello.txt"])
    assert "hello" in git.diff(staged=True)
