from __future__ import annotations

import math

import numpy as np
import pandas as pd
import pytest
from hypothesis import given, settings
from hypothesis import strategies as st

from qa_indicators.sma import compute


def _frame(values: list[float]) -> pd.DataFrame:
    idx = pd.date_range("2024-01-01", periods=len(values), freq="D")
    return pd.DataFrame({"close": values}, index=idx)


def test_sma_of_constant_series_equals_constant_after_window() -> None:
    period = 5
    df = _frame([7.5] * 20)
    out = compute(df, period=period)
    tail = out["sma"].iloc[period - 1 :].to_numpy()
    assert np.allclose(tail, 7.5)


def test_sma_length_matches_input_length() -> None:
    df = _frame(list(range(30)))
    out = compute(df, period=10)
    assert len(out) == len(df)
    assert list(out.index) == list(df.index)


def test_sma_nan_before_window() -> None:
    period = 4
    df = _frame([float(i) for i in range(10)])
    out = compute(df, period=period)
    head = out["sma"].iloc[: period - 1]
    assert head.isna().all()
    # First valid value is the mean of the first ``period`` observations.
    assert math.isclose(out["sma"].iloc[period - 1], sum(range(period)) / period)


def test_sma_rejects_invalid_period() -> None:
    with pytest.raises(ValueError):
        compute(_frame([1.0, 2.0, 3.0]), period=1)


def test_sma_rejects_invalid_source() -> None:
    with pytest.raises(ValueError):
        compute(_frame([1.0, 2.0, 3.0]), period=2, source="vwap")


@settings(max_examples=25, deadline=None)
@given(
    constant=st.floats(min_value=-1e6, max_value=1e6, allow_nan=False, allow_infinity=False),
    period=st.integers(min_value=2, max_value=50),
    length=st.integers(min_value=2, max_value=120),
)
def test_property_sma_of_constant_equals_constant(constant: float, period: int, length: int) -> None:
    length = max(length, period)
    df = _frame([constant] * length)
    out = compute(df, period=period)
    tail = out["sma"].iloc[period - 1 :].to_numpy()
    assert np.allclose(tail, constant, equal_nan=False)
