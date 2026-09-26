"""Explicit risk and permission policy for automation."""

from dataclasses import dataclass
from enum import Enum


class Risk(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


@dataclass(frozen=True)
class PermissionPolicy:
    allow_medium: bool = False
    allow_high: bool = False

    def permits(self, risk: Risk) -> bool:
        if risk is Risk.LOW:
            return True
        if risk is Risk.MEDIUM:
            return self.allow_medium
        return self.allow_high

    def require(self, risk: Risk, action: str) -> None:
        if not self.permits(risk):
            raise PermissionError(f"permission required for {risk.value}-risk action: {action}")
