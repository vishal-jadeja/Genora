import asyncpg
from fastapi import APIRouter, Depends

from app.core.db import get_connection
from app.schemas.rag import RagRetrieveRequest, RagRetrieveResponse
from app.services.embeddings import GeminiEmbedder, get_embedder
from app.services.rag import find_similar_posts

router = APIRouter()


@router.post("/rag/retrieve")
async def retrieve_similar(
    request: RagRetrieveRequest,
    conn: asyncpg.Connection = Depends(get_connection),
    embedder: GeminiEmbedder = Depends(get_embedder),
) -> RagRetrieveResponse:
    query_embedding = await embedder.embed(request.query_text)
    matches = await find_similar_posts(conn, request.user_id, query_embedding, request.limit)
    return RagRetrieveResponse(matches=matches)
