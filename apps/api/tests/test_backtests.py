import pytest
from fastapi.testclient import TestClient

from qa_api.main import app

client = TestClient(app)


def test_list_presets_includes_sma_crossover():
    r = client.get("/backtests/presets")
    assert r.status_code == 200
    ids = {p["id"] for p in r.json()}
    assert "sma_crossover" in ids


def test_run_unknown_preset_404():
    r = client.post("/backtests/", json={"preset": "does-not-exist", "params": {}})
    assert r.status_code == 404


def test_run_invalid_params_422():
    r = client.post("/backtests/", json={"preset": "sma_crossover", "params": {"bogus": 1}})
    assert r.status_code == 422


def test_run_param_below_min_422():
    r = client.post("/backtests/", json={"preset": "sma_crossover", "params": {"fast": 0}})
    assert r.status_code == 422


@pytest.mark.slow
def test_run_sma_crossover_succeeds():
    r = client.post(
        "/backtests/",
        json={"preset": "sma_crossover", "params": {"fast": 20, "slow": 50}},
    )
    if r.status_code == 500 and "bundled bars not available" in r.json().get("detail", ""):
        pytest.skip("parity_input.json not present")
    assert r.status_code == 200, r.text
    payload = r.json()
    assert "result" in payload
    assert payload["config_hash"]
    assert payload["result"]["metrics"]["trade_count"] >= 0


def test_post_with_both_code_and_preset_422() -> None:
    r = client.post(
        "/backtests/",
        json={
            "preset": "sma_crossover",
            "code": "def run(close):\n    return {'signal': [0] * len(close)}\n",
        },
    )
    assert r.status_code == 422


def test_post_with_neither_code_nor_preset_422() -> None:
    r = client.post("/backtests/", json={})
    assert r.status_code == 422


def test_post_with_oversized_code_413() -> None:
    big = "def run(close):\n    " + ("x=1\n    " * 12_000) + "return {'signal':[0]*len(close)}\n"
    assert len(big.encode()) > 65_536
    r = client.post("/backtests/", json={"code": big})
    assert r.status_code == 413


@pytest.mark.slow
def test_post_with_valid_code_runs_and_returns_result() -> None:
    code = "def run(close):\n    return {'signal': [0] * len(close), 'note': 'flat'}\n"
    r = client.post("/backtests/", json={"code": code, "params": {}})
    if r.status_code == 500 and "bundled bars not available" in r.json().get("detail", ""):
        pytest.skip("parity_input.json not present")
    assert r.status_code == 200, r.text
    payload = r.json()
    assert "result" in payload
    assert payload["config_hash"]
    # Untrusted mode emits a "degenerate" result with flat equity
    assert payload["result"]["metrics"]["trade_count"] == 0
