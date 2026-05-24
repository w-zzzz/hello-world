from fastapi.testclient import TestClient

from qa_api.main import app

client = TestClient(app)


def test_healthz_ok():
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {"ok": True}


def test_version_present():
    response = client.get("/version")
    assert response.status_code == 200
    assert "version" in response.json()
