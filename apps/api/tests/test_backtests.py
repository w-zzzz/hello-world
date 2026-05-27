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
