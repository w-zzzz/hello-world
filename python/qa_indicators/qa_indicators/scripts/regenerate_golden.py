"""Regenerate parity_input.json + golden output JSONs from canonical Python impls.

Usage::

    python -m qa_indicators.scripts.regenerate_golden            # writes files
    python -m qa_indicators.scripts.regenerate_golden --verify   # exits 1 if any differ

Both modes recompute everything; ``--verify`` never writes, only diffs.

The PRNG / OHLCV generation here is a byte-identical Python port of
``packages/charts/src/sample-data.ts``. To sanity-check, the first bar of
the default 252-bar series (seed=42, end=2024-12-31) is::

    {"t": "2024-01-15", "open": 400.0, "high": 400.55, "low": 391.91,
     "close": 395.56, "volume": 56812821}

and the last bar is::

    {"t": "2024-12-31", "open": 467.96, "high": 469.99, "low": 459.76,
     "close": 460.6, "volume": 111887506}

If you change anything in the PRNG or bar formulas here, the TS parity test
in ``packages/indicators-ts`` will start failing — bump both sides in lock-step.
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

import pandas as pd

from qa_indicators.registry import REGISTRY, get_compute

FIXTURES_DIR = Path(__file__).resolve().parents[1] / "fixtures"
GOLDEN_DIR = FIXTURES_DIR / "golden"
INPUT_PATH = FIXTURES_DIR / "parity_input.json"

ABS_TOL = 1e-9
REL_TOL = 1e-6

# --- JS bitwise emulation -------------------------------------------------

_MASK32 = 0xFFFFFFFF


def _to_int32(x: int) -> int:
    """Truncate to signed 32-bit (mirrors JS ``x | 0``)."""

    x &= _MASK32
    if x >= 0x80000000:
        x -= 0x100000000
    return x


def _to_uint32(x: int) -> int:
    """Truncate to unsigned 32-bit (mirrors JS ``x >>> 0``)."""

    return x & _MASK32


def _ushr(x: int, n: int) -> int:
    """Unsigned right shift (mirrors JS ``x >>> n``)."""

    return (x & _MASK32) >> n


def _imul(a: int, b: int) -> int:
    """32-bit signed multiplication (mirrors JS ``Math.imul``)."""

    a32 = a & _MASK32
    b32 = b & _MASK32
    if a32 >= 0x80000000:
        a32 -= 0x100000000
    if b32 >= 0x80000000:
        b32 -= 0x100000000
    product = (a32 * b32) & _MASK32
    if product >= 0x80000000:
        product -= 0x100000000
    return product


def _js_round(x: float) -> int:
    """JS ``Math.round``: rounds half toward +Infinity."""

    return math.floor(x + 0.5)


def _round2(x: float) -> float:
    return _js_round(x * 100) / 100


def mulberry32(seed: int) -> Callable[[], float]:
    """Pure Python port of the JS ``mulberry32`` PRNG from sample-data.ts."""

    state = [_to_int32(seed)]

    def rng() -> float:
        a = _to_int32(state[0] + 0x6D2B79F5)
        state[0] = a
        t = _imul(_to_int32(a ^ _ushr(a, 15)), 1 | a)
        inner = _imul(_to_int32(t ^ _ushr(t, 7)), 61 | t)
        t = _to_int32((t + inner) & _MASK32) ^ t
        return _to_uint32(t ^ _ushr(t, 14)) / 4294967296

    return rng


def gauss(rng: Callable[[], float]) -> float:
    """Box-Muller transform; mirrors the JS impl (skip 0 values for u and v)."""

    u = 0.0
    v = 0.0
    while u == 0:
        u = rng()
    while v == 0:
        v = rng()
    return math.sqrt(-2.0 * math.log(u)) * math.cos(2.0 * math.pi * v)


def walk_back_trading_days(end_iso: str, count: int) -> list[str]:
    """Walk back from ``end_iso`` (UTC) collecting weekday dates, returned ascending."""

    end_dt = datetime.fromisoformat(f"{end_iso}T00:00:00+00:00").astimezone(UTC)
    dates: list[str] = []
    d = end_dt
    while len(dates) < count:
        # JS getUTCDay: Sun=0..Sat=6. Python weekday(): Mon=0..Sun=6.
        # Map: (python_weekday + 1) % 7 == js_day.
        js_day = (d.weekday() + 1) % 7
        if js_day != 0 and js_day != 6:
            dates.insert(0, d.strftime("%Y-%m-%d"))
        d = d - timedelta(days=1)
    return dates


def generate_input_bars(
    count: int = 252, seed: int = 42, end_iso: str = "2024-12-31"
) -> list[dict[str, Any]]:
    """Generate the canonical 252-bar SPY-like daily OHLCV series.

    Byte-identical to ``generateSpyDaily(seed, count, endIso)`` in the TS
    ``packages/charts/src/sample-data.ts``.
    """

    rng = mulberry32(seed)
    dates = walk_back_trading_days(end_iso, count)
    bars: list[dict[str, Any]] = []
    close = 400.0
    drift = 0.0003
    vol = 0.012
    for i, date in enumerate(dates):
        ret = drift + vol * gauss(rng)
        open_p = close if i == 0 else bars[i - 1]["close"] * (1 + 0.001 * gauss(rng))
        new_close = open_p * math.exp(ret)
        high = max(open_p, new_close) * (1 + abs(gauss(rng)) * 0.005)
        low = min(open_p, new_close) * (1 - abs(gauss(rng)) * 0.005)
        volume = 80_000_000 * math.exp(gauss(rng) * 0.3)
        bars.append(
            {
                "t": date,
                "open": _round2(open_p),
                "high": _round2(high),
                "low": _round2(low),
                "close": _round2(new_close),
                "volume": _js_round(volume),
            }
        )
        close = new_close
    return bars


def _serialize_outputs(df: pd.DataFrame) -> dict[str, list[float | None]]:
    outputs: dict[str, list[float | None]] = {}
    for col in df.columns:
        series: list[float | None] = []
        for raw in df[col].to_list():
            v = float(raw)
            if math.isnan(v):
                series.append(None)
            else:
                series.append(v)
        outputs[col] = series
    return outputs


def _golden_payload(indicator_id: str, params: dict[str, Any], df: pd.DataFrame) -> dict[str, Any]:
    return {
        "indicator": indicator_id,
        "params": params,
        "input": "parity_input.json",
        "tolerance": {"abs": ABS_TOL, "rel": REL_TOL},
        "outputs": _serialize_outputs(df),
    }


def _format_json(payload: Any) -> str:
    # ``json.dumps`` uses ``repr`` for floats, preserving full precision —
    # exactly what we want for the parity check.
    return json.dumps(payload, indent=2, allow_nan=False)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--verify",
        action="store_true",
        help="Exit non-zero if regenerated files differ from on-disk fixtures.",
    )
    args = parser.parse_args()

    GOLDEN_DIR.mkdir(parents=True, exist_ok=True)

    bars = generate_input_bars()
    input_payload = {"bars": bars}
    input_json = _format_json(input_payload) + "\n"

    failed = False

    if args.verify:
        existing = INPUT_PATH.read_text() if INPUT_PATH.exists() else ""
        if existing != input_json:
            print("FAIL: parity_input.json differs from regenerated output", file=sys.stderr)
            failed = True
    else:
        INPUT_PATH.write_text(input_json)

    # Build DataFrame from bars for indicator computation.
    df = pd.DataFrame(bars)
    df["t"] = pd.to_datetime(df["t"], utc=True)
    df = df.set_index("t")

    for indicator_id, meta in REGISTRY.items():
        compute = get_compute(indicator_id)
        params: dict[str, Any] = {k: spec.default for k, spec in meta.params.items()}
        result = compute(df, **params)
        golden = _golden_payload(indicator_id, params, result)
        golden_json = _format_json(golden) + "\n"
        path = GOLDEN_DIR / f"{indicator_id}.json"
        if args.verify:
            existing = path.read_text() if path.exists() else ""
            if existing != golden_json:
                print(f"FAIL: golden/{indicator_id}.json differs from regenerated", file=sys.stderr)
                failed = True
        else:
            path.write_text(golden_json)

    if failed:
        return 1
    if not args.verify:
        print(f"Regenerated parity_input.json + {len(REGISTRY)} golden files in {FIXTURES_DIR}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
