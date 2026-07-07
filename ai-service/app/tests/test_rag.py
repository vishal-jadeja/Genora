from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.db import get_connection
from app.main import app
from app.services.embeddings import get_embedder
from app.services.rag import find_similar_posts

client = TestClient(app)
AUTH_HEADERS = {"x-internal-secret": settings.internal_service_secret}


@pytest.fixture(autouse=True)
def _clear_dependency_overrides():
    yield
    app.dependency_overrides.clear()


class _FakeConnection:
    def __init__(self, rows: list[dict]) -> None:
        self.rows = rows
        self.last_query: str | None = None
        self.last_args: tuple | None = None

    async def fetch(self, query: str, *args: object) -> list[dict]:
        self.last_query = query
        self.last_args = args
        return self.rows


class _FakeEmbedder:
    def __init__(self, vector: list[float]) -> None:
        self.vector = vector

    async def embed(self, text: str) -> list[float]:
        return self.vector


async def test_find_similar_posts_maps_rows_and_orders_query_args():
    user_id = uuid4()
    post_id = uuid4()
    conn = _FakeConnection([{"post_id": post_id, "content": "an old post", "distance": 0.12}])
    embedding = [0.1, 0.2, 0.3]

    matches = await find_similar_posts(conn, user_id, embedding, limit=5)

    assert len(matches) == 1
    assert matches[0].post_id == post_id
    assert matches[0].content == "an old post"
    assert matches[0].distance == 0.12
    assert conn.last_args == (embedding, user_id, 5)


async def test_find_similar_posts_handles_no_matches():
    conn = _FakeConnection([])

    matches = await find_similar_posts(conn, uuid4(), [0.1], limit=5)

    assert matches == []


def test_retrieve_endpoint_requires_internal_secret():
    response = client.post(
        "/rag/retrieve", json={"user_id": str(uuid4()), "query_text": "some past thought"}
    )
    assert response.status_code == 401


def test_retrieve_endpoint_returns_matches():
    user_id = uuid4()
    post_id = uuid4()
    app.dependency_overrides[get_connection] = lambda: _FakeConnection(
        [{"post_id": post_id, "content": "an old post", "distance": 0.05}]
    )
    app.dependency_overrides[get_embedder] = lambda: _FakeEmbedder([0.1, 0.2])

    response = client.post(
        "/rag/retrieve",
        json={"user_id": str(user_id), "query_text": "some past thought"},
        headers=AUTH_HEADERS,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["matches"] == [
        {"post_id": str(post_id), "content": "an old post", "distance": 0.05}
    ]


def test_retrieve_endpoint_rejects_limit_out_of_range():
    # Overridden even though this request should fail validation: FastAPI
    # resolves route dependencies before it surfaces body-validation errors,
    # so this would otherwise hit the real (uninitialized) pool first.
    app.dependency_overrides[get_connection] = lambda: _FakeConnection([])
    app.dependency_overrides[get_embedder] = lambda: _FakeEmbedder([0.1])

    response = client.post(
        "/rag/retrieve",
        json={"user_id": str(uuid4()), "query_text": "some past thought", "limit": 50},
        headers=AUTH_HEADERS,
    )
    assert response.status_code == 422


def test_retrieve_endpoint_rejects_empty_query_text():
    app.dependency_overrides[get_connection] = lambda: _FakeConnection([])
    app.dependency_overrides[get_embedder] = lambda: _FakeEmbedder([0.1])

    response = client.post(
        "/rag/retrieve",
        json={"user_id": str(uuid4()), "query_text": ""},
        headers=AUTH_HEADERS,
    )
    assert response.status_code == 422
