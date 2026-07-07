from google import genai
from google.genai import types

from app.core.config import settings

# Truncated via Matryoshka/MRL to 768-dim — fixed regardless of which BYOK
# provider/model the user picks for generation (see backend-plan.md).
EMBEDDING_MODEL = "gemini-embedding-001"
EMBEDDING_DIMENSIONS = 768


class GeminiEmbedder:
    def __init__(self, client: genai.Client) -> None:
        self._client = client

    async def embed(self, text: str) -> list[float]:
        response = await self._client.aio.models.embed_content(
            model=EMBEDDING_MODEL,
            contents=text,
            config=types.EmbedContentConfig(output_dimensionality=EMBEDDING_DIMENSIONS),
        )
        if not response.embeddings:
            raise RuntimeError("Gemini returned no embedding for the given text")
        return response.embeddings[0].values


_embedder: GeminiEmbedder | None = None


def get_embedder() -> GeminiEmbedder:
    """FastAPI dependency: lazily builds a singleton client from the platform key."""
    global _embedder
    if _embedder is None:
        _embedder = GeminiEmbedder(genai.Client(api_key=settings.gemini_api_key))
    return _embedder
