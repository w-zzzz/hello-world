from __future__ import annotations

import numpy as np
import pandas as pd
import pytest
from hypothesis import given, settings
from hypothesis import strategies as st

from qa_indicators.rsi import compute


def _frame(values: list[float]) -> pd.DataFrame:
    idx = pd.date_range("2024-01-01", periods=len(values), freq="D")
    return pd.DataFrame({"close": values}, index=idx)


def test_rsi_first_period_values_are_nan() -> None:
    period = 14
    df = _frame([float(i) for i in range(60)])
    out = compute(df, period=period)
    assert out["rsi"].iloc[:period].isna().all()
    assert not out["rsi"].iloc[period:].isna().any()


def test_rsi_monotonic_increasing_series_is_100() -> None:
    df = _frame([float(i) for i in range(40)])
    out = compute(df, period=14)
    tail = out["rsi"].iloc[14:].to_numpy()
    assert np.allclose(tail, 100.0)


def test_rsi_monotonic_decreasing_series_is_zero() -> None:
    df = _frame([float(40 - i) for i in range(40)])
    out = compute(df, period=14)
    tail = out["rsi"].iloc[14:].to_numpy()
    assert np.allclose(tail, 0.0)


def test_rsi_rejects_invalid_period() -> None:
    with pytest.raises(ValueError):
        compute(_frame([1.0, 2.0, 3.0]), period=1)


def test_rsi_rejects_invalid_source() -> None:
    with pytest.raises(ValueError):
        compute(_frame([1.0, 2.0, 3.0]), period=2, source="vwap")


@settings(max_examples=30, deadline=None)
@given(
    values=st.lists(
        st.floats(min_value=1.0, max_value=1e5, allow_nan=False, allow_infinity=False),
        min_size=30,
        max_size=200,
    ),
    period=st.integers(min_value=2, max_value=20),
)
def test_property_rsi_in_zero_one_hundred_range(values: list[float], period: int) -> None:
    if len(values) <= period:
        return
    df = _frame(values)
    out = compute(df, period=period)
    defined = out["rsi"].dropna().to_numpy()
    if defined.size == 0:
        return
    assert (defined >= 0.0).all()
    assert (defined <= 100.0).all()
