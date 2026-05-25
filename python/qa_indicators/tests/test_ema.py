from __future__ import annotations

import math

import numpy as np
import pandas as pd
import pytest
from hypothesis import given, settings
from hypothesis import strategies as st

from qa_indicators.ema import compute


def _frame(values: list[float]) -> pd.DataFrame:
    idx = pd.date_range("2024-01-01", periods=len(values), freq="D")
    return pd.DataFrame({"close": values}, index=idx)


def test_ema_of_constant_series_equals_constant_after_warmup() -> None:
    period = 5
    df = _frame([3.25] * 30)
    out = compute(df, period=period)
    head = out["ema"].iloc[: period - 1]
    tail = out["ema"].iloc[period - 1 :].to_numpy()
    assert head.isna().all()
    assert np.allclose(tail, 3.25)


def test_ema_length_matches_input() -> None:
    df = _frame([float(i) for i in range(40)])
    out = compute(df, period=10)
    assert len(out) == len(df)
    assert list(out.index) == list(df.index)


def test_ema_first_defined_is_sma_seed() -> None:
    period = 4
    values = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0]
    out = compute(_frame(values), period=period)
    assert out["ema"].iloc[: period - 1].isna().all()
    assert math.isclose(out["ema"].iloc[period - 1], sum(values[:period]) / period)


def test_ema_recursion_matches_manual_formula() -> None:
    period = 3
    values = [10.0, 12.0, 14.0, 16.0, 18.0]
    out = compute(_frame(values), period=period)
    alpha = 2.0 / (period + 1)
    seed = (10.0 + 12.0 + 14.0) / 3
    expected_idx3 = alpha * 16.0 + (1 - alpha) * seed
    expected_idx4 = alpha * 18.0 + (1 - alpha) * expected_idx3
    assert math.isclose(out["ema"].iloc[3], expected_idx3)
    assert math.isclose(out["ema"].iloc[4], expected_idx4)


def test_ema_rejects_invalid_period() -> None:
    with pytest.raises(ValueError):
        compute(_frame([1.0, 2.0, 3.0]), period=1)


def test_ema_rejects_invalid_source() -> None:
    with pytest.raises(ValueError):
        compute(_frame([1.0, 2.0, 3.0]), period=2, source="vwap")


def test_ema_responds_faster_with_smaller_period() -> None:
    """A smaller-period EMA should react more strongly to a step jump."""

    values = [100.0] * 50 + [200.0] * 50
    df = _frame(values)
    short = compute(df, period=5)["ema"].iloc[60]
    long = compute(df, period=30)["ema"].iloc[60]
    # Both still climbing toward 200; short is ahead of long.
    assert short > long
    assert long > 100.0


@settings(max_examples=30, deadline=None)
@given(
    constant=st.floats(min_value=-1e6, max_value=1e6, allow_nan=False, allow_infinity=False),
    period=st.integers(min_value=2, max_value=40),
    length=st.integers(min_value=2, max_value=120),
)
def test_property_ema_of_constant_equals_constant(
    constant: float, period: int, length: int
) -> None:
    length = max(length, period)
    df = _frame([constant] * length)
    out = compute(df, period=period)
    tail = out["ema"].iloc[period - 1 :].to_numpy()
    assert np.allclose(tail, constant)
