from pathlib import Path

from autopilot.memory import ProjectMemory


def test_project_memory_round_trip(tmp_path: Path) -> None:
    memory = ProjectMemory(tmp_path)
    memory.add("architecture", "Services communicate over HTTP.")
    memory.add("convention", "Use conventional commits.")
    assert [(item.category, item.content) for item in memory.entries()] == [("architecture", "Services communicate over HTTP."), ("convention", "Use conventional commits.")]
