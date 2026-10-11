"""Tests for the AI service. The embedding model is stubbed so no download is needed."""
import sys
import types
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


class _Vec(list):
    def tolist(self):
        return list(self)


class _FakeModel:
    def __init__(self, *_args, **_kwargs):
        pass

    def encode(self, text):
        return _Vec([float(len(text)), 0.0, 1.0])


@pytest.fixture(scope="module")
def client():
    fake = types.ModuleType("sentence_transformers")
    fake.SentenceTransformer = _FakeModel
    sys.modules["sentence_transformers"] = fake
    sys.modules.pop("main", None)

    from fastapi.testclient import TestClient
    import main

    return TestClient(main.app)


def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_analyze_returns_expected_shape(client):
    res = client.post("/analyze", data={"text": "Big pothole on Anna Salai"})
    assert res.status_code == 200
    body = res.json()
    for key in ("category", "severity", "confidence", "context", "duration_days", "summary", "embedding"):
        assert key in body
    assert body["summary"] == "Big pothole on Anna Salai"
    assert isinstance(body["embedding"], list) and body["embedding"]


def test_analyze_truncates_summary_to_100_chars(client):
    res = client.post("/analyze", data={"text": "x" * 250})
    assert len(res.json()["summary"]) == 100


def test_analyze_handles_empty_text(client):
    res = client.post("/analyze", data={})
    assert res.status_code == 200
    assert res.json()["summary"] == ""
