"""Permission-gated, reviewable, reversible code patch application."""

from dataclasses import dataclass
from pathlib import Path
import re
import tempfile
import hashlib
import json
from datetime import datetime, timezone

from .autonomous import FixProposal
from .checkpoints import CheckpointManager, FlightRecorder
from .git_engine import GitEngine, GitError
from .permissions import PermissionPolicy, Risk
from .security import SecretScanner


class PatchError(RuntimeError):
    """Raised when a proposed patch is unsafe or cannot be applied."""


@dataclass(frozen=True)
class PatchResult:
    files: tuple[str, ...]
    checkpoint: str
    applied: bool
    patch_id: str = ""


class PatchApplier:
    def __init__(self, root: str | Path = ".") -> None:
        self.root = Path(root).expanduser().resolve()
        self.git = GitEngine(self.root)
        self.checkpoints = CheckpointManager(self.root)
        self.recorder = FlightRecorder(self.root)

    def _paths(self, patch: str) -> tuple[str, ...]:
        paths = []
        for line in patch.splitlines():
            if line.startswith("+++ b/"):
                paths.append(line[6:])
            elif line.startswith("--- a/"):
                paths.append(line[6:])
            elif line.startswith(("+++ ", "--- ")) and "/dev/null" not in line:
                raise PatchError("patch paths must use a/ and b/ prefixes")
        unique = tuple(sorted(set(paths)))
        if not unique:
            raise PatchError("patch contains no file changes")
        for value in unique:
            path = Path(value)
            if path.is_absolute() or ".." in path.parts or ".git" in path.parts or ".autopilot" in path.parts:
                raise PatchError(f"unsafe patch path: {value}")
        return unique

    def validate(self, proposal: FixProposal) -> tuple[str, ...]:
        patch = proposal.patch.strip()
        if not patch or "GIT binary patch" in patch:
            raise PatchError("only non-empty text unified patches are supported")
        if re.search(r"(?i)(api[_-]?key|password|secret|token)\s*[:=]\s*['\"]?.{8,}", patch):
            raise PatchError("patch contains a secret-like assignment")
        paths = self._paths(patch)
        declared = {str(Path(item)) for item in proposal.files}
        if declared and not set(paths) <= declared:
            raise PatchError("patch modifies files outside the declared proposal")
        return paths

    def apply(self, proposal: FixProposal, *, allow_medium: bool = False, allow_high: bool = False, approve: bool = False) -> PatchResult:
        self.recorder.record("ai_patch_attempt", title=proposal.title[:120], risk=proposal.risk.value, approved=str(approve))
        if proposal.requires_approval and not approve:
            raise PermissionError("explicit approval required before applying AI patch")
        policy = PermissionPolicy(allow_medium=allow_medium, allow_high=allow_high)
        policy.require(proposal.risk, "apply code patch")
        self.git.require_repository()
        paths = self.validate(proposal)
        checkpoint = self.checkpoints.create("before-ai-patch")
        patch_file = self._write_patch(proposal.patch)
        try:
            self.git._git("apply", "--check", "--", str(patch_file))
            self.git._git("apply", "--whitespace=error", "--", str(patch_file))
            findings = SecretScanner().scan(self.root)
            if findings:
                self._reverse(proposal.patch)
                raise PatchError(f"patch introduced or exposed {len(findings)} likely secret(s)")
        except (GitError, OSError) as exc:
            try:
                self._reverse(proposal.patch)
            except Exception:
                pass
            raise PatchError(f"patch was not safely applied: {exc}") from exc
        finally:
            patch_file.unlink(missing_ok=True)
        patch_id = self._save_history(proposal.patch, paths, checkpoint.commit, proposal.title)
        self.recorder.record("ai_patch_applied", files=",".join(paths), checkpoint=checkpoint.commit, risk=proposal.risk.value, patch_id=patch_id)
        return PatchResult(paths, checkpoint.commit, True, patch_id)

    def rollback(self, patch: str) -> None:
        self.validate(FixProposal("rollback", "", self._paths(patch), patch, Risk.MEDIUM))
        self._reverse(patch)
        self.recorder.record("ai_patch_rolled_back", files=",".join(self._paths(patch)))

    def rollback_last(self, patch_id: str | None = None) -> str:
        history = self.root / ".autopilot" / "patch-history.jsonl"
        if not history.exists():
            raise PatchError("no applied AI patches found")
        rows = [json.loads(line) for line in history.read_text().splitlines() if line.strip()]
        candidates = [row for row in rows if not row.get("rolled_back")]
        if patch_id:
            candidates = [row for row in candidates if row.get("patch_id") == patch_id]
        if not candidates:
            raise PatchError("requested applied patch was not found or was already rolled back")
        row = candidates[-1]
        self._reverse(row["patch"])
        row["rolled_back"] = True
        history.write_text("\n".join(json.dumps(item, sort_keys=True) for item in rows) + "\n")
        self.recorder.record("ai_patch_recovered", patch_id=row["patch_id"], files=",".join(row["files"]))
        return str(row["patch_id"])

    def _save_history(self, patch: str, paths: tuple[str, ...], checkpoint: str, title: str) -> str:
        patch_id = hashlib.sha256(patch.encode()).hexdigest()[:16]
        history = self.root / ".autopilot" / "patch-history.jsonl"
        history.parent.mkdir(parents=True, exist_ok=True)
        row = {"patch_id": patch_id, "timestamp": datetime.now(timezone.utc).isoformat(), "files": list(paths), "checkpoint": checkpoint, "title": title[:120], "patch": patch, "rolled_back": False}
        with history.open("a", encoding="utf-8") as stream:
            stream.write(json.dumps(row, sort_keys=True) + "\n")
        return patch_id

    def _write_patch(self, patch: str) -> Path:
        self.root.joinpath(".autopilot").mkdir(parents=True, exist_ok=True)
        handle = tempfile.NamedTemporaryFile("w", encoding="utf-8", suffix=".patch", dir=self.root / ".autopilot", delete=False)
        with handle:
            handle.write(patch)
            handle.write("\n")
        return Path(handle.name)

    def _reverse(self, patch: str) -> None:
        patch_file = self._write_patch(patch)
        try:
            self.git._git("apply", "-R", "--", str(patch_file))
        finally:
            patch_file.unlink(missing_ok=True)
