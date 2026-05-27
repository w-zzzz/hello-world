"""Happy-path: executor → runner → BacktestResult JSON round trip."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from qa_sandbox import SandboxError, execute

FIXTURE = (
    Path(__file__).resolve().parents[2]
    / "qa_indicators"
    / "qa_indicators"
    / "fixtures"
    / "parity_input.json"
)


def _bars() -> list[dict[str, object]]:
    data = json.loads(FIXTURE.read_text())
    return list(data["bars"])


def test_execute_sma_crossover_returns_backtest_result() -> None:
    job = {
        "preset": "sma_crossover",
        "params": {"fast": 20, "slow": 50},
        "data": _bars(),
    }
    result = execute(job, timeout=45)
    assert "metrics" in result
    assert "equity_curve" in result
    assert "trades" in result
    assert "period" in result
    assert result["metrics"]["trade_count"] == len(result["trades"])
    assert len(result["equity_curve"]) == len(job["data"])
    # The schema is strict — all required keys are present.
    for key in (
        "run_id",
        "config_hash",
        "universe",
        "drawdown_periods",
        "artifacts",
        "warnings",
    ):
        assert key in result


def test_execute_rejects_unknown_preset() -> None:
    with pytest.raises(SandboxError) as excinfo:
        execute(
            {"preset": "no_such_preset", "params": {}, "data": _bars()},
            timeout=45,
        )
    assert "unknown preset" in str(excinfo.value) or "exited with 1" in str(excinfo.value)


def test_execute_rejects_malformed_job_spec() -> None:
    # Valid JSON, but missing the "preset" field — runner exits 1.
    # The malformed-JSON path is covered separately by the subprocess-level
    # negative tests.
    with pytest.raises(SandboxError):
        execute({"params": {}, "data": _bars()}, timeout=45)
