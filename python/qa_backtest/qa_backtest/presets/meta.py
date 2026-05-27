"""Shared :class:`PresetMeta` definition.

Lives in its own module so both the registry and individual preset modules
can import it without setting up a circular import.
"""

from __future__ import annotations

from dataclasses import dataclass

from qa_core.schemas import ParamSpec


@dataclass(frozen=True)
class PresetMeta:
    """Static metadata describing a backtest preset (no runner attached)."""

    id: str
    name_zh: str
    name_en: str
    description_zh: str
    description_en: str
    params: dict[str, ParamSpec]
