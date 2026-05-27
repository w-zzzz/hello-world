from __future__ import annotations

import hashlib
import json
from pathlib import Path

from qa_backtest.engine import canonical_config_hash
from qa_backtest.presets.sma_crossover import run_sma_crossover
from qa_core.schemas import Bar

FIXTURE = (
    Path(__file__).resolve().parents[2]
    / "qa_indicators"
    / "qa_indicators"
    / "fixtures"
    / "parity_input.json"
)


def _hash_result() -> str:
    data = json.loads(FIXTURE.read_text())
    bars = [Bar(**b) for b in data["bars"]]
    r = run_sma_crossover(bars, fast=20, slow=50)
    payload = r.model_dump(mode="json")
    payload.pop("run_id")
    return hashlib.sha256(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest()


def test_five_runs_bit_identical() -> None:
    hashes = {_hash_result() for _ in range(5)}
    assert len(hashes) == 1, f"non-deterministic: {hashes}"


def test_canonical_config_hash_is_stable() -> None:
    cfg = {
        "preset": "sma_crossover",
        "params": {"fast": 20, "slow": 50},
        "universe": ["SPY"],
        "period": {"start": "2024-01-15", "end": "2025-01-14"},
    }
    h1 = canonical_config_hash(cfg)
    h2 = canonical_config_hash(dict(reversed(list(cfg.items()))))
    assert h1 == h2
    # Distinct payload yields a distinct hash.
    cfg2 = dict(cfg)
    cfg2["params"] = {"fast": 10, "slow": 30}
    assert canonical_config_hash(cfg2) != h1


def test_canonical_config_hash_handles_date() -> None:
    from datetime import date

    cfg = {
        "start": date(2024, 1, 15),
        "end": date(2024, 12, 31),
    }
    assert len(canonical_config_hash(cfg)) == 64  # sha256 hex
