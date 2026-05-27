"""Registry of named backtest presets.

The registry has two parallel maps:

* :data:`PRESETS` — pure metadata (the catalog the frontend renders).
* :data:`PRESET_RUNNERS` — callable that takes ``bars`` + params and returns
  a :class:`BacktestResult`.

Keeping them separate makes it trivial to import the metadata in a context
that should not pull in vectorbt (e.g. a thin API listing endpoint).
"""

from __future__ import annotations

from collections.abc import Callable

from qa_backtest.presets.meta import PresetMeta
from qa_backtest.presets.sma_crossover import SMA_CROSSOVER_META, run_sma_crossover
from qa_core.schemas import BacktestResult

PRESETS: dict[str, PresetMeta] = {
    SMA_CROSSOVER_META.id: SMA_CROSSOVER_META,
}


PRESET_RUNNERS: dict[str, Callable[..., BacktestResult]] = {
    SMA_CROSSOVER_META.id: run_sma_crossover,
}


def get_preset(preset_id: str) -> PresetMeta | None:
    """Return preset metadata, or ``None`` if not registered."""
    return PRESETS.get(preset_id)


def get_runner(preset_id: str) -> Callable[..., BacktestResult] | None:
    """Return the runner callable, or ``None`` if not registered."""
    return PRESET_RUNNERS.get(preset_id)
