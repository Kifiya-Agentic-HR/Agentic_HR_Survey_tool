from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Query
import json
from pydantic import BaseModel
from typing import Dict, Optional
import uuid
from src.api.services.file_processor import process_file, chunk_text
from src.api.core.weaviate import get_weaviate_client

router = APIRouter(prefix="/exit-ingest", tags=["Exit Document Ingestion"])


class ExitIngestionMetadata(BaseModel):
    tag: str  # e.g. "resignation", "manager-note"
    source: str  # e.g. "email", "scan", "manual-entry"
    author: Optional[str] = None
    custom_metadata: Dict = {}  # e.g. {"department": "Finance", "language": "en"}


@router.post("/documents", summary="Upload and ingest an exit-related document")
async def ingest_exit_document(
    file: UploadFile = File(...),
    metadata: str = Form(...)
):
    try:
        # Parse metadata
        metadata_dict = json.loads(metadata)
        metadata_obj = ExitIngestionMetadata(**metadata_dict)

        weaviate_client = await get_weaviate_client()
        file_content = await process_file(file)
        chunks = chunk_text(file_content)

        document_id = str(uuid.uuid4())
        results = []

        for i, chunk in enumerate(chunks):
            chunk_id = f"{document_id}_chunk{i}"
            data_object = {
                "text": chunk,
                "file_name": file.filename,
                "tag": metadata_obj.tag,
                "chunk_index": i,
                "total_chunks": len(chunks),
                "metadata": {
                    **metadata_obj.custom_metadata,
                    "source": metadata_obj.source,
                    "author": metadata_obj.author,
                }
            }

            weaviate_client.data_object.create(
                data_object=data_object,
                class_name="ExitDocumentChunk",
                uuid=chunk_id
            )
            results.append(chunk_id)

        return {
            "document_id": document_id,
            "chunk_ids": results,
            "total_chunks": len(chunks)
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Document ingestion failed: {str(e)}"
        )


@router.get("/search/exit-documents", summary="Semantic search across exit documents")
async def semantic_search_exit_docs(
    query: str = Query(..., description="e.g., 'burnout and lack of growth'"),
    limit: int = 5
):
    try:
        weaviate_client = await get_weaviate_client()
        response = weaviate_client.query.get("ExitDocumentChunk", ["text", "file_name", "metadata"]) \
            .with_near_text({"concepts": [query]}) \
            .with_limit(limit) \
            .do()

        return response["data"]["Get"]["ExitDocumentChunk"]
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Semantic search failed: {str(e)}"
        )


@router.delete("/documents/{document_id}", summary="Delete exit document and its chunks")
async def delete_exit_document(document_id: str):
    try:
        weaviate_client = await get_weaviate_client()

        # Assumes all chunk IDs are in format {document_id}_chunk{index}
        for i in range(1000):  # upper bound for max expected chunks
            chunk_id = f"{document_id}_chunk{i}"
            try:
                weaviate_client.data_object.delete(uuid=chunk_id, class_name="ExitDocumentChunk")
            except:
                break  # Assume we're done deleting when one fails

        return {"message": f"Chunks for document {document_id} deleted"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Deletion failed: {str(e)}"
        )
