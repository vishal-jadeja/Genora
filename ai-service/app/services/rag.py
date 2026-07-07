from typing import Protocol
from uuid import UUID

from app.schemas.rag import RagMatch

_SIMILARITY_QUERY = """
    SELECT post_id, content, embedding <=> $1 AS distance
    FROM embeddings
    WHERE user_id = $2
    ORDER BY embedding <=> $1
    LIMIT $3
"""


class SupportsFetch(Protocol):
    """The one asyncpg.Connection method this module needs — narrowed so
    tests can pass a fake connection without stubbing the whole driver."""

    async def fetch(self, query: str, *args: object) -> list: ...


async def find_similar_posts(
    conn: SupportsFetch, user_id: UUID, query_embedding: list[float], limit: int
) -> list[RagMatch]:
    rows = await conn.fetch(_SIMILARITY_QUERY, query_embedding, user_id, limit)
    return [
        RagMatch(post_id=row["post_id"], content=row["content"], distance=row["distance"])
        for row in rows
    ]
