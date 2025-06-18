from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from src.api.core.weaviate import get_weaviate_client

router = APIRouter(prefix="/exit-retrieve", tags=["Exit Document Retrieval"])


class RetrievalRequest(BaseModel):
    query: str  # Example: "lack of recognition", "better salary"
    tag: str    # Example: "resignation", "manager-note"
    limit: int = 3
    similarity_threshold: Optional[float] = 0.7


class DocumentResponse(BaseModel):
    id: str
    text: str
    file_name: str
    tag: str
    confidence: float
    metadata: dict


@router.post("/semantic-search", response_model=List[DocumentResponse])
async def semantic_search(request: RetrievalRequest):
    try:
        weaviate_client = await get_weaviate_client()
        response = (
            weaviate_client.query
            .get("ExitDocumentChunk", ["text", "file_name", "tag", "metadata", "_additional { id certainty }"])
            .with_near_text({
                "concepts": [request.query],
                "certainty": request.similarity_threshold
            })
            .with_where({
                "path": ["tag"],
                "operator": "Equal",
                "valueText": request.tag
            })
            .with_limit(request.limit)
            .do()
        )

        results = response.get('data', {}).get('Get', {}).get('ExitDocumentChunk', [])
        return [
            DocumentResponse(
                id=item["_additional"]["id"],
                text=item["text"],
                file_name=item["file_name"],
                tag=item["tag"],
                confidence=item["_additional"]["certainty"],
                metadata=item["metadata"]
            )
            for item in results
        ]

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Semantic search failed: {str(e)}"
        )
