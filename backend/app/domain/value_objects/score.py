"""
Suitability score value object — encapsulates trading bay analysis result.

Score range: 0–100. Verdict derived from score + blocking constraints.
Pattern: Value Object (DDD) — immutable, equality by value.
"""

from __future__ import annotations

import enum
from dataclasses import dataclass, field


class SuitabilityVerdict(str, enum.Enum):
    """Trading bay suitability verdict — tri-state outcome."""

    SUITABLE = "SUITABLE"
    CONDITIONAL = "CONDITIONAL"
    UNSUITABLE = "UNSUITABLE"


@dataclass(frozen=True, slots=True)
class SuitabilityScore:
    """
    Immutable suitability assessment result.

    Complexity: O(k) where k = number of constraint checks.
    The score is computed once during construction; all reads are O(1).
    """

    score: int
    verdict: SuitabilityVerdict
    blocking_constraints: tuple[str, ...] = field(default_factory=tuple)
    conditional_flags: tuple[str, ...] = field(default_factory=tuple)
    details: dict = field(default_factory=dict)

    def __post_init__(self) -> None:
        if not 0 <= self.score <= 100:
            raise ValueError(f"Score must be 0–100, got {self.score}")

    @classmethod
    def unsuitable(cls, reason: str, **details) -> SuitabilityScore:
        """Factory — create UNSUITABLE result with blocking constraint."""
        return cls(
            score=0,
            verdict=SuitabilityVerdict.UNSUITABLE,
            blocking_constraints=(reason,),
            details=details,
        )

    @classmethod
    def suitable(cls, score: int, **details) -> SuitabilityScore:
        """Factory — create SUITABLE result."""
        return cls(
            score=min(max(score, 0), 100),
            verdict=SuitabilityVerdict.SUITABLE,
            details=details,
        )

    @classmethod
    def conditional(
        cls, score: int, flags: tuple[str, ...], **details
    ) -> SuitabilityScore:
        """Factory — create CONDITIONAL result with advisory flags."""
        return cls(
            score=min(max(score, 0), 100),
            verdict=SuitabilityVerdict.CONDITIONAL,
            conditional_flags=flags,
            details=details,
        )

    def to_dict(self) -> dict:
        """Serialize for API response."""
        return {
            "score": self.score,
            "verdict": self.verdict.value,
            "blocking_constraints": list(self.blocking_constraints),
            "conditional_flags": list(self.conditional_flags),
            "details": self.details,
        }
