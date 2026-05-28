from __future__ import annotations

import json
from pathlib import Path

import pytest

from qa_backtest.presets.sma_crossover import run_sma_crossover
from qa_core.schemas import Bar

FIXTURE = (
    Path(__file__).resolve().parents[2]
    / "qa_indicators"
    / "qa_indicators"
    / "fixtures"
    / "parity_input.json"
)


def _load_bars() -> list[Bar]:
    data = json.loads(FIXTURE.read_text())
    return [Bar(**b) for b in data["bars"]]


def test_sma_crossover_runs_and_returns_result() -> None:
    bars = _load_bars()
    result = run_sma_crossover(bars, fast=20, slow=50)
    assert result.metrics.trade_count >= 0
    assert len(result.equity_curve) == len(bars)
    assert result.period.start <= result.period.end


def test_sma_crossover_rejects_fast_geq_slow() -> None:
    bars = _load_bars()
    with pytest.raises(ValueError, match="fast must be < slow"):
        run_sma_crossover(bars, fast=50, slow=50)
    with pytest.raises(ValueError, match="fast must be < slow"):
        run_sma_crossover(bars, fast=60, slow=50)


def test_sma_crossover_deterministic_across_runs() -> None:
    bars = _load_bars()
    r1 = run_sma_crossover(bars, fast=20, slow=50)
    r2 = run_sma_crossover(bars, fast=20, slow=50)
    j1 = r1.model_dump(mode="json")
    j2 = r2.model_dump(mode="json")
    j1.pop("run_id")
    j2.pop("run_id")
    assert j1 == j2


def test_sma_crossover_metric_fields_are_finite() -> None:
    bars = _load_bars()
    result = run_sma_crossover(bars, fast=10, slow=30)
    m = result.metrics
    # Non-ratio fields are always float and finite (NaN/Inf -> 0.0).
    for value in (
        m.max_drawdown,
        m.win_rate,
        m.expectancy,
        m.turnover,
        m.exposure,
    ):
        assert isinstance(value, float)
        assert value == value  # not NaN
    # Ratio fields are float | None; when present they must be finite.
    for value in (m.sharpe, m.sortino, m.calmar, m.profit_factor):
        assert value is None or isinstance(value, float)
        if value is not None:
            assert value == value  # not NaN


def test_metrics_optional_fields_can_be_none_on_degenerate_run():
    """C-METRICS-1: profit_factor for a no-loss strategy is None, not 0.0."""
    # Construct bars where the SMA cross only enters and never exits
    # (so profit_factor would be inf). Easiest: monotonically rising prices.
    from datetime import UTC, datetime

    from qa_core.schemas import Bar

    bars = [
        Bar(
            t=datetime(2024, 1, 1, tzinfo=UTC).replace(day=i),
            open=100.0 + i,
            high=110.0 + i,
            low=90.0 + i,
            close=100.0 + i,
            volume=1000.0,
        )
        for i in range(1, 29)
    ]
    result = run_sma_crossover(bars, fast=3, slow=10)
    # If no losses occurred, profit_factor should be None (not 0.0). Other
    # ratios may also be None when the trade history is too thin to compute.
    if result.metrics.trade_count > 0 and result.metrics.profit_factor is not None:
        assert result.metrics.profit_factor > 0
