import pytest

from app.services.embeddings import GeminiEmbedder


class _FakeContentEmbedding:
    def __init__(self, values: list[float]) -> None:
        self.values = values


class _FakeEmbedResponse:
    def __init__(self, embeddings: list[_FakeContentEmbedding]) -> None:
        self.embeddings = embeddings


class _FakeModels:
    def __init__(self, response: _FakeEmbedResponse) -> None:
        self._response = response

    async def embed_content(self, *, model: str, contents: str, config: object):
        return self._response


class _FakeAio:
    def __init__(self, response: _FakeEmbedResponse) -> None:
        self.models = _FakeModels(response)


class _FakeGenaiClient:
    def __init__(self, response: _FakeEmbedResponse) -> None:
        self.aio = _FakeAio(response)


async def test_embed_returns_values_from_first_embedding():
    values = [0.1] * 768
    client = _FakeGenaiClient(_FakeEmbedResponse([_FakeContentEmbedding(values)]))
    embedder = GeminiEmbedder(client)

    result = await embedder.embed("hello world")

    assert result == values


async def test_embed_raises_when_dimension_mismatches():
    client = _FakeGenaiClient(_FakeEmbedResponse([_FakeContentEmbedding([0.1, 0.2, 0.3])]))
    embedder = GeminiEmbedder(client)

    with pytest.raises(RuntimeError, match="768"):
        await embedder.embed("hello world")


async def test_embed_raises_when_gemini_returns_no_embeddings():
    client = _FakeGenaiClient(_FakeEmbedResponse([]))
    embedder = GeminiEmbedder(client)

    with pytest.raises(RuntimeError, match="no embedding"):
        await embedder.embed("hello world")
