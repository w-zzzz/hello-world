from __future__ import annotations

import numpy as np
import pandas as pd
import pytest
from hypothesis import given, settings
from hypothesis import strategies as st

from qa_indicators.macd import compute


def _frame(values: list[float]) -> pd.DataFrame:
    idx = pd.date_range("2024-01-01", periods=len(values), freq="D")
    return pd.DataFrame({"close": values}, index=idx)


def test_macd_columns_and_length() -> None:
    df = _frame([100.0 + i * 0.5 for i in range(120)])
    out = compute(df)
    assert list(out.columns) == ["macd", "signal", "histogram"]
    assert len(out) == len(df)


def test_macd_histogram_equals_macd_minus_signal() -> None:
    df = _frame([100.0 + i * 0.5 for i in range(120)])
    out = compute(df)
    defined = out.dropna()
    assert not defined.empty
    diff = defined["macd"].to_numpy() - defined["signal"].to_numpy()
    assert np.allclose(diff, defined["histogram"].to_numpy())


def test_macd_of_constant_series_is_zero() -> None:
    df = _frame([42.0] * 200)
    out = compute(df)
    defined = out["macd"].dropna().to_numpy()
    assert defined.size > 0
    assert np.allclose(defined, 0.0)
    sig_defined = out["signal"].dropna().to_numpy()
    assert np.allclose(sig_defined, 0.0)
    hist_defined = out["histogram"].dropna().to_numpy()
    assert np.allclose(hist_defined, 0.0)


def test_macd_warmup_indices() -> None:
    df = _frame([100.0 + i * 0.3 for i in range(120)])
    out = compute(df, fast=12, slow=26, signal=9)
    # MACD line first defined at index slow - 1 = 25.
    assert out["macd"].iloc[:25].isna().all()
    assert not np.isnan(out["macd"].iloc[25])
    # Signal seeds after `signal` consecutive defined macd values, i.e.
    # index 25 + 9 - 1 = 33.
    assert out["signal"].iloc[:33].isna().all()
    assert not np.isnan(out["signal"].iloc[33])


def test_macd_rejects_invalid_params() -> None:
    df = _frame([1.0, 2.0, 3.0, 4.0])
    with pytest.raises(ValueError):
        compute(df, fast=26, slow=12)
    with pytest.raises(ValueError):
        compute(df, fast=1)
    with pytest.raises(ValueError):
        compute(df, source="vwap")


@settings(max_examples=20, deadline=None)
@given(
    values=st.lists(
        st.floats(min_value=1.0, max_value=1e5, allow_nan=False, allow_infinity=False),
        min_size=80,
        max_size=200,
    ),
)
def test_property_histogram_identity(values: list[float]) -> None:
    df = _frame(values)
    out = compute(df)
    defined = out.dropna()
    if defined.empty:
        return
    diff = defined["macd"].to_numpy() - defined["signal"].to_numpy()
    assert np.allclose(diff, defined["histogram"].to_numpy())
