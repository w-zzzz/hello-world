from __future__ import annotations

from datetime import UTC, date, datetime

import pytest
from pydantic import ValidationError

from qa_core.schemas import (
    BacktestResult,
    Bar,
    DateRange,
    DrawdownPeriod,
    EquityPoint,
    IndicatorMeta,
    IndicatorOutput,
    Metrics,
    ParamKind,
    ParamSpec,
    Trade,
)


def test_bar_accepts_valid_ohlc() -> None:
    bar = Bar(
        t=datetime(2024, 1, 2, 14, 30, tzinfo=UTC),
        open=100.0,
        high=101.5,
        low=99.0,
        close=100.75,
        volume=12345.0,
    )
    assert bar.close == 100.75
    assert bar.volume == 12345.0


def test_strict_model_rejects_extra_fields() -> None:
    with pytest.raises(ValidationError):
        Bar(  # type: ignore[call-arg]
            t=datetime(2024, 1, 2, tzinfo=UTC),
            open=1.0,
            high=1.0,
            low=1.0,
            close=1.0,
            volume=1.0,
            extra="nope",
        )


def test_indicator_meta_serializes_params_dict() -> None:
    meta = IndicatorMeta(
        id="sma",
        name_zh="简单移动平均线",
        name_en="Simple Moving Average",
        category="overlay",
        formula_tex=r"\mathrm{SMA}_t = \frac{1}{n}\sum P_{t-i}",
        params={
            "period": ParamSpec(kind=ParamKind.INT, default=20, min=2, max=400, step=1),
        },
        outputs=[IndicatorOutput(name="sma", kind="overlay")],
    )
    dumped = meta.model_dump(mode="json")
    assert dumped["id"] == "sma"
    assert dumped["params"]["period"]["kind"] == "int"
    assert dumped["params"]["period"]["default"] == 20
    assert dumped["outputs"][0]["kind"] == "overlay"


def _minimal_metrics() -> Metrics:
    return Metrics(
        sharpe=1.2,
        sortino=1.4,
        calmar=0.8,
        max_drawdown=-0.15,
        profit_factor=1.6,
        win_rate=0.55,
        expectancy=0.02,
        turnover=1.1,
        exposure=0.7,
        trade_count=42,
    )


def test_backtest_result_roundtrips_json() -> None:
    ts = datetime(2024, 1, 2, tzinfo=UTC)
    result = BacktestResult(
        config_hash="abc123",
        universe=["AAPL"],
        period=DateRange(start=date(2024, 1, 1), end=date(2024, 12, 31)),
        equity_curve=[
            EquityPoint(t=ts, equity=100.0, cash=50.0, position_value=50.0),
        ],
        trades=[
            Trade(
                entry_t=ts,
                exit_t=ts,
                side="long",
                qty=1.0,
                entry=100.0,
                exit=101.0,
                pnl=1.0,
                mae=-0.5,
                mfe=1.2,
                bars_held=3,
            )
        ],
        metrics=_minimal_metrics(),
        drawdown_periods=[
            DrawdownPeriod(start=ts, trough=ts, recovery=None, depth=-0.05),
        ],
    )

    payload = result.model_dump_json()
    restored = BacktestResult.model_validate_json(payload)
    assert restored.config_hash == "abc123"
    assert restored.universe == ["AAPL"]
    assert restored.metrics.trade_count == 42
    assert restored.run_id == result.run_id
