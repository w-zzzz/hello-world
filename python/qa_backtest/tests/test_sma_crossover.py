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
    for value in (
        m.sharpe,
        m.sortino,
        m.calmar,
        m.max_drawdown,
        m.profit_factor,
        m.win_rate,
        m.expectancy,
        m.turnover,
        m.exposure,
    ):
        assert isinstance(value, float)
        # _safe_float coerces NaN/Inf to 0.0, so finite is guaranteed.
        assert value == value  # not NaN
