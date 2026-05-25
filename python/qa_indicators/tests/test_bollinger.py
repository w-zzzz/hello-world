from __future__ import annotations

import numpy as np
import pandas as pd
import pytest
from hypothesis import given, settings
from hypothesis import strategies as st

from qa_indicators.bollinger import compute


def _frame(values: list[float]) -> pd.DataFrame:
    idx = pd.date_range("2024-01-01", periods=len(values), freq="D")
    return pd.DataFrame({"close": values}, index=idx)


def test_bollinger_columns_and_length() -> None:
    df = _frame([100.0 + i * 0.5 for i in range(60)])
    out = compute(df)
    assert list(out.columns) == ["middle", "upper", "lower"]
    assert len(out) == len(df)


def test_bollinger_ordering_upper_middle_lower() -> None:
    df = _frame([100.0 + np.sin(i / 5) * 5 for i in range(80)])
    out = compute(df, period=20, stddev=2.0).dropna()
    assert not out.empty
    assert (out["upper"].to_numpy() >= out["middle"].to_numpy()).all()
    assert (out["middle"].to_numpy() >= out["lower"].to_numpy()).all()


def test_bollinger_collapses_to_middle_on_constant_series() -> None:
    df = _frame([55.0] * 60)
    out = compute(df, period=20, stddev=2.0).dropna()
    assert np.allclose(out["middle"].to_numpy(), 55.0)
    assert np.allclose(out["upper"].to_numpy(), 55.0)
    assert np.allclose(out["lower"].to_numpy(), 55.0)


def test_bollinger_widens_with_stddev_param() -> None:
    df = _frame([100.0 + np.sin(i / 4) * 5 for i in range(80)])
    narrow = compute(df, period=20, stddev=1.0).dropna()
    wide = compute(df, period=20, stddev=3.0).dropna()
    # Wider stddev produces strictly wider bands wherever sigma > 0.
    narrow_width = narrow["upper"].to_numpy() - narrow["lower"].to_numpy()
    wide_width = wide["upper"].to_numpy() - wide["lower"].to_numpy()
    assert (wide_width >= narrow_width - 1e-12).all()
    assert (wide_width > narrow_width).any()


def test_bollinger_rejects_invalid_params() -> None:
    df = _frame([1.0, 2.0, 3.0, 4.0])
    with pytest.raises(ValueError):
        compute(df, period=1)
    with pytest.raises(ValueError):
        compute(df, period=2, stddev=0.0)
    with pytest.raises(ValueError):
        compute(df, source="vwap")


@settings(max_examples=25, deadline=None)
@given(
    values=st.lists(
        st.floats(min_value=1.0, max_value=1e5, allow_nan=False, allow_infinity=False),
        min_size=25,
        max_size=200,
    ),
    period=st.integers(min_value=2, max_value=20),
    stddev=st.floats(min_value=0.5, max_value=4.0, allow_nan=False, allow_infinity=False),
)
def test_property_band_ordering(values: list[float], period: int, stddev: float) -> None:
    if len(values) <= period:
        return
    df = _frame(values)
    out = compute(df, period=period, stddev=stddev).dropna()
    if out.empty:
        return
    upper = out["upper"].to_numpy()
    middle = out["middle"].to_numpy()
    lower = out["lower"].to_numpy()
    # Allow tiny float wobble.
    assert (upper - middle >= -1e-9).all()
    assert (middle - lower >= -1e-9).all()
