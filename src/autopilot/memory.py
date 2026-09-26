"""Small human-readable project memory store."""

from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
import json


@dataclass(frozen=True)
class MemoryEntry:
    category: str
    content: str
    created_at: str = ""
    source: str = "manual"


class ProjectMemory:
    def __init__(self, root: str | Path = ".") -> None:
        self.path = Path(root).expanduser().resolve() / ".autopilot" / "memory.json"

    def entries(self) -> tuple[MemoryEntry, ...]:
        if not self.path.exists():
            return ()
        data = json.loads(self.path.read_text())
        return tuple(MemoryEntry(str(item["category"]), str(item["content"]), str(item.get("created_at", "")), str(item.get("source", "manual"))) for item in data)

    def add(self, category: str, content: str, *, source: str = "manual") -> MemoryEntry:
        category, content = category.strip(), content.strip()
        if not category or not content:
            raise ValueError("category and content are required")
        if any(item.category == category and item.content == content for item in self.entries()):
            return next(item for item in self.entries() if item.category == category and item.content == content)
        entry = MemoryEntry(category, content, datetime.now(timezone.utc).isoformat(), source)
        all_entries = [*self.entries(), entry]
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text(json.dumps([asdict(item) for item in all_entries], indent=2) + "\n")
        return entry

    def relevant(self, query: str, limit: int = 10) -> tuple[MemoryEntry, ...]:
        terms = {term.lower() for term in query.split() if len(term) > 2}
        scored = []
        for item in self.entries():
            haystack = f"{item.category} {item.content}".lower()
            score = sum(term in haystack for term in terms)
            if score:
                scored.append((score, item))
        scored.sort(key=lambda pair: (-pair[0], pair[1].created_at), reverse=False)
        return tuple(item for _, item in scored[:limit])
