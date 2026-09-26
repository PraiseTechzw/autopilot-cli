"""Structured local observability without leaking credentials."""

from datetime import datetime, timezone
import json
from pathlib import Path
import re
import time

_SECRET = re.compile(r"(?i)(token|password|secret|api[_-]?key)\s*[:=]\s*[^\s,]+")


def safe(value: object) -> str:
    text = str(value)
    return _SECRET.sub(lambda match: f"{match.group(1)}=[REDACTED]", text)[:1000]


class EventLogger:
    def __init__(self, root: str | Path = ".") -> None:
        self.path = Path(root).expanduser().resolve() / ".autopilot" / "observability.jsonl"

    def emit(self, event: str, **fields: object) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        payload = {"timestamp": datetime.now(timezone.utc).isoformat(), "event": event}
        payload.update({key: "[REDACTED]" if re.search(r"(?i)(token|password|secret|api[_-]?key)", key) else safe(value) for key, value in fields.items()})
        with self.path.open("a", encoding="utf-8") as stream:
            stream.write(json.dumps(payload, sort_keys=True) + "\n")

    def read(self, limit: int = 100) -> list[dict]:
        if not self.path.exists():
            return []
        rows = []
        for line in self.path.read_text(encoding="utf-8").splitlines()[-limit:]:
            try:
                item = json.loads(line)
                if isinstance(item, dict):
                    rows.append(item)
            except json.JSONDecodeError:
                continue
        return rows


class Timer:
    def __init__(self, logger: EventLogger, event: str, **fields: object) -> None:
        self.logger, self.event, self.fields = logger, event, fields
        self.started = time.perf_counter()

    def finish(self, *, ok: bool = True, **fields: object) -> None:
        merged = {**self.fields, **fields, "ok": ok, "duration_ms": round((time.perf_counter() - self.started) * 1000, 2)}
        self.logger.emit(self.event, **merged)
