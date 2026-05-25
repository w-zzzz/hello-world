"""API-level tests that also act as a third independent witness in the parity contract.
If these tests pass, the server-computed indicator outputs match the committed golden JSON.
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from qa_api.main import app

client = TestClient(app)

FIXTURES = (
    Path(__file__).resolve().parents[3]
    / "python"
    / "qa_indicators"
    / "qa_indicators"
    / "fixtures"
)


def _load_input():
    p = FIXTURES / "parity_input.json"
    if not p.exists():
        pytest.skip("parity_input.json not generated yet")
    return json.loads(p.read_text())["bars"]


def _load_golden(indicator_id: str):
    p = FIXTURES / "golden" / f"{indicator_id}.json"
    if not p.exists():
        pytest.skip(f"golden/{indicator_id}.json not generated yet")
    return json.loads(p.read_text())


def test_list_indicators_includes_all_five():
    r = client.get("/indicators/")
    assert r.status_code == 200
    ids = {row["id"] for row in r.json()}
    assert ids >= {"sma", "ema", "rsi", "macd", "bollinger"}


def test_get_unknown_indicator_404():
    r = client.get("/indicators/does-not-exist")
    assert r.status_code == 404


def test_compute_unknown_indicator_404():
    bars = _load_input()
    r = client.post("/indicators/nope/compute", json={"bars": bars[:30], "params": {}})
    assert r.status_code == 404


def test_compute_invalid_param_422():
    bars = _load_input()
    # period of 0 is below SMA's min of 2
    r = client.post("/indicators/sma/compute", json={"bars": bars[:30], "params": {"period": 0}})
    assert r.status_code == 422


def test_compute_extra_param_422():
    bars = _load_input()
    r = client.post(
        "/indicators/sma/compute",
        json={"bars": bars[:30], "params": {"period": 20, "source": "close", "bogus": 42}},
    )
    assert r.status_code == 422


@pytest.mark.parametrize("indicator_id", ["sma", "ema", "rsi", "macd", "bollinger"])
def test_compute_matches_golden(indicator_id: str):
    bars = _load_input()
    golden = _load_golden(indicator_id)
    r = client.post(
        f"/indicators/{indicator_id}/compute",
        json={"bars": bars, "params": golden["params"]},
    )
    assert r.status_code == 200, r.text
    payload = r.json()
    assert payload["indicator"] == indicator_id
    assert set(payload["outputs"].keys()) == set(golden["outputs"].keys())
    abs_tol = golden["tolerance"]["abs"]
    rel_tol = golden["tolerance"]["rel"]
    for col, expected in golden["outputs"].items():
        actual = payload["outputs"][col]
        assert len(actual) == len(expected)
        for i, (a, e) in enumerate(zip(actual, expected, strict=True)):
            if a is None and e is None:
                continue
            assert a is not None and e is not None, f"{col}[{i}]: None mismatch"
            diff = abs(a - e)
            tol = max(abs_tol, rel_tol * max(abs(a), abs(e)))
            assert diff <= tol, f"{col}[{i}]: expected {e}, got {a}, diff {diff} > {tol}"
