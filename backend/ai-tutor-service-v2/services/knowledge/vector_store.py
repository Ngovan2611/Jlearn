
from functools import lru_cache

import chromadb
from sentence_transformers import SentenceTransformer

from core.config import settings


EMBEDDING_MODEL_NAME = (
    "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
)


@lru_cache(maxsize=1)
def get_embedding_model() -> SentenceTransformer:
    """Load model once and reuse it."""
    return SentenceTransformer(EMBEDDING_MODEL_NAME)


class VectorStore:
    def __init__(self):
        self.client = chromadb.PersistentClient(
            path=settings.CHROMA_PATH
        )

        self.collection = self.client.get_or_create_collection(
            name=settings.CHROMA_COLLECTION,
            metadata={"hnsw:space": "cosine"},
        )

    @staticmethod
    def _build_where(
        course_id: str | None = None,
        lesson_id: str | None = None,
    ) -> dict | None:
        filters = []

        if course_id:
            filters.append({
                "course_id": {"$eq": str(course_id)}
            })

        if lesson_id:
            filters.append({
                "lesson_id": {"$eq": str(lesson_id)}
            })

        if len(filters) == 1:
            return filters[0]

        if len(filters) > 1:
            return {"$and": filters}

        return None

    def upsert_chunks(self, chunks: list[dict]) -> None:
        """Create embeddings and insert or update chunks in ChromaDB."""
        if not chunks:
            return

        model = get_embedding_model()

        ids = [chunk["id"] for chunk in chunks]
        documents = [chunk["content"] for chunk in chunks]
        metadatas = [chunk.get("metadata", {}) for chunk in chunks]

        embeddings = model.encode(
            documents,
            normalize_embeddings=True,
            show_progress_bar=False,
        ).tolist()

        self.collection.upsert(
            ids=ids,
            documents=documents,
            metadatas=metadatas,
            embeddings=embeddings,
        )

    def delete_stale_chunks(
        self,
        course_id: str,
        lesson_id: str,
        valid_ids: list[str],
    ) -> None:
        """Delete outdated chunks for a lesson after successful indexing."""
        where = self._build_where(
            course_id=course_id,
            lesson_id=lesson_id,
        )

        if where is None:
            return

        result = self.collection.get(
            where=where,
            include=["metadatas"],
        )

        existing_ids = result.get("ids") or []
        valid_id_set = set(valid_ids)

        stale_ids = [
            chunk_id
            for chunk_id in existing_ids
            if chunk_id not in valid_id_set
        ]

        if stale_ids:
            self.collection.delete(ids=stale_ids)

    def get_chunks(
        self,
        course_id: str | None = None,
        lesson_id: str | None = None,
    ) -> list[dict]:
        where = self._build_where(course_id, lesson_id)

        query_args = {
            "include": ["documents", "metadatas"]
        }

        if where is not None:
            query_args["where"] = where

        result = self.collection.get(**query_args)

        ids = result.get("ids") or []
        documents = result.get("documents") or []
        metadatas = result.get("metadatas") or []

        return [
            {
                "id": chunk_id,
                "content": document or "",
                "metadata": metadata or {},
            }
            for chunk_id, document, metadata in zip(
                ids, documents, metadatas
            )
            if document and document.strip()
        ]

    def search_vectors(
    self,
    query: str,
    course_id: str | None = None,
    lesson_id: str | None = None,
    top_k: int = 10,
) -> list[dict]:
        """Search chunks by semantic similarity."""

        if not query or not query.strip() or top_k < 1:
            return []

        model = get_embedding_model()

        query_embedding = model.encode(
            query.strip(),
            normalize_embeddings=True,
            show_progress_bar=False,
        ).tolist()

        where = self._build_where(
            course_id=course_id,
            lesson_id=lesson_id,
        )

        # Avoid requesting more results than the collection contains.
        collection_size = self.collection.count()

        if collection_size == 0:
            return []

        query_args = {
            "query_embeddings": [query_embedding],
            "n_results": min(top_k, collection_size),
            "include": [
                "documents",
                "metadatas",
                "distances",
            ],
        }

        if where is not None:
            query_args["where"] = where

        result = self.collection.query(**query_args)

        ids = (result.get("ids") or [[]])[0]
        documents = (result.get("documents") or [[]])[0]
        metadatas = (result.get("metadatas") or [[]])[0]
        distances = (result.get("distances") or [[]])[0]

        chunks = []

        for chunk_id, document, metadata, distance in zip(
            ids,
            documents,
            metadatas,
            distances,
        ):
            if not document or not document.strip():
                continue

            distance = float(distance)

            chunks.append({
                "id": chunk_id,
                "content": document,
                "metadata": metadata or {},
                "distance": distance,
                "score": 1.0 - distance,
            })

        # Highest similarity first.
        chunks.sort(
            key=lambda chunk: chunk["score"],
            reverse=True,
        )

        return chunks

    def get_course_chunks(
        self,
        course_id: str | None = None,
        lesson_id: str | None = None,
    ) -> list[dict]:
        # Backward compatibility with existing callers.
        return self.get_chunks(course_id, lesson_id)
