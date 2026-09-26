"""Test-driven debugging loop with automatic rollback on failed verification."""

from dataclasses import dataclass
from pathlib import Path
from typing import Callable

from .autonomous import FixProposal
from .checkpoints import FlightRecorder
from .patching import PatchApplier, PatchError, PatchResult
from .verification import VerificationEngine, VerificationResult


@dataclass(frozen=True)
class DebugIteration:
    number: int
    verification: VerificationResult
    proposal: FixProposal | None
    patch: PatchResult | None
    rolled_back: bool
    reason: str


class DebuggingLoop:
    def __init__(self, root: str | Path = ".", *, max_iterations: int = 3) -> None:
        if max_iterations < 1 or max_iterations > 10:
            raise ValueError("max_iterations must be between 1 and 10")
        self.root = Path(root).expanduser().resolve()
        self.max_iterations = max_iterations
        self.applier = PatchApplier(self.root)
        self.recorder = FlightRecorder(self.root)

    def run(self, propose: Callable[[VerificationResult], FixProposal], *, allow_medium: bool = False, allow_high: bool = False) -> tuple[DebugIteration, ...]:
        results: list[DebugIteration] = []
        for number in range(1, self.max_iterations + 1):
            verification = VerificationEngine(self.root).run()
            if verification.passed:
                results.append(DebugIteration(number, verification, None, None, False, "verification passed"))
                self.recorder.record("debugging_stopped", reason="verification passed", iteration=str(number))
                break
            proposal = propose(verification)
            if not proposal.patch.strip():
                results.append(DebugIteration(number, verification, proposal, None, False, "no applicable patch proposal"))
                self.recorder.record("debugging_stopped", reason="no patch proposal", iteration=str(number))
                break
            try:
                patch = self.applier.apply(proposal, allow_medium=allow_medium, allow_high=allow_high, approve=allow_medium or allow_high)
            except (PatchError, PermissionError) as exc:
                results.append(DebugIteration(number, verification, proposal, None, False, str(exc)))
                self.recorder.record("debugging_stopped", reason=str(exc)[:300], iteration=str(number))
                break
            after = VerificationEngine(self.root).run()
            if after.passed:
                results.append(DebugIteration(number, after, proposal, patch, False, "patch verified"))
                self.recorder.record("debugging_patch_verified", iteration=str(number))
                break
            self.applier.rollback(proposal.patch)
            results.append(DebugIteration(number, after, proposal, patch, True, "patch rolled back after failed verification"))
            self.recorder.record("debugging_patch_rolled_back", iteration=str(number))
        return tuple(results)
