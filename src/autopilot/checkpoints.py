"""Checkpoint, replay, and audit primitives for safe automation."""

from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
import json
from typing import Callable

from .git_engine import GitEngine


@dataclass(frozen=True)
class Checkpoint:
    timestamp: str
    commit: str
    label: str


class FlightRecorder:
    def __init__(self, root: str | Path = ".") -> None:
        self.path = Path(root).expanduser().resolve() / ".autopilot" / "flight-recorder.jsonl"

    def record(self, event: str, **details: str) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        payload = {"timestamp": datetime.now(timezone.utc).isoformat(), "event": event, **details}
        with self.path.open("a", encoding="utf-8") as stream:
            stream.write(json.dumps(payload, sort_keys=True) + "\n")

    def events(self, limit: int | None = None) -> list[dict]:
        if not self.path.exists():
            return []
        events: list[dict] = []
        for line in self.path.read_text().splitlines():
            try:
                item = json.loads(line)
                if isinstance(item, dict):
                    events.append(item)
            except json.JSONDecodeError:
                continue
        return events[-limit:] if limit else events

    def replay(self, handler: Callable[[dict], object] | None = None, *, limit: int | None = None) -> tuple[object, ...]:
        """Replay recorded events to an observer; it never re-executes side effects."""
        events = self.events(limit)
        if handler is None:
            return tuple(events)
        return tuple(handler(event) for event in events)


class CheckpointManager:
    def __init__(self, root: str | Path = ".") -> None:
        self.git = GitEngine(root)
        self.recorder = FlightRecorder(root)

    def create(self, label: str = "checkpoint") -> Checkpoint:
        self.git.require_repository()
        commit = self.git._git("rev-parse", "HEAD", check=False).stdout.strip() or "NO_COMMIT"
        point = Checkpoint(datetime.now(timezone.utc).isoformat(), commit, label)
        self.recorder.record("checkpoint_created", label=label, commit=commit)
        return point
