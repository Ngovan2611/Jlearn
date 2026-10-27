
import re
import unicodedata
from collections import defaultdict

from rank_bm25 import BM25Okapi

from services.knowledge.vector_store import VectorStore


def normalize_text(text: str) -> str:
    text = text.casefold()
    text = unicodedata.normalize("NFD", text)
    text = "".join(
        char
        for char in text
        if unicodedata.category(char) != "Mn"
    )
    return text.replace("đ", "d")


def normalize_token(token: str) -> str:
    token = token.casefold().strip().strip(".")
    token = re.sub(r"[^a-z0-9_+#]", "", token)

    aliases = {
        "indexes": "index",
        "indexing": "index",
        "queries": "query",
    }

    return aliases.get(token, token)


def tokenize(text: str) -> list[str]:
    normalized = normalize_text(text)
    raw_tokens = re.findall(r"[a-z0-9_+#.]+", normalized)

    return [
        normalized_token
        for token in raw_tokens
        if (normalized_token := normalize_token(token))
    ]


class RetrievalService:
    def __init__(self):
        self.vector_store = VectorStore()

    @staticmethod
    def _rrf_score(rank: int, constant: int = 60) -> float:
        return 1.0 / (constant + rank)

    @staticmethod
    def _chunk_id(chunk: dict) -> str | None:
        chunk_id = chunk.get("id")

        if chunk_id is not None:
            return str(chunk_id)

        metadata = chunk.get("metadata") or {}
        return metadata.get("id")

    @staticmethod
    def _searchable_text(chunk: dict) -> str:
        metadata = chunk.get("metadata") or {}

        return " ".join(
            str(value)
            for value in (
                metadata.get("course_title", ""),
                metadata.get("lesson_title", ""),
                metadata.get("description", ""),
                chunk.get("content", ""),
            )
            if value
        )

    def search(
        self,
        question: str,
        course_id: str | None = None,
        lesson_id: str | None = None,
        top_k: int = 4,
    ) -> list[dict]:
        if not question or not question.strip() or top_k < 1:
            return []

        query_tokens = tokenize(question)

        if not query_tokens:
            return []

        # 1. Lấy các chunk phù hợp với phạm vi truy vấn.
        chunks = self.vector_store.get_chunks(
            course_id=course_id,
            lesson_id=lesson_id,
        )

        valid_chunks = []
        documents = []

        for chunk in chunks:
            searchable_text = self._searchable_text(chunk)
            tokens = tokenize(searchable_text)

            if tokens:
                valid_chunks.append(chunk)
                documents.append(tokens)

        # 2. Xếp hạng BM25.
        bm25_ranked = []

        if documents:
            bm25 = BM25Okapi(documents)
            scores = bm25.get_scores(query_tokens)

            candidates = []

            for chunk, score in zip(valid_chunks, scores):
                score = float(score)

                if score > 0:
                    candidates.append({
                        **chunk,
                        "bm25_score": score,
                    })

            candidates.sort(
                key=lambda item: item["bm25_score"],
                reverse=True,
            )

            bm25_ranked = candidates

        # 3. Vector search lấy nhiều ứng viên hơn top_k.
        candidate_k = max(top_k * 5, 20)

        vector_ranked = self.vector_store.search_vectors(
            query=question,
            course_id=course_id,
            lesson_id=lesson_id,
            top_k=candidate_k,
        )

        # 4. Hợp nhất theo RRF.
        merged = {}

        for rank, chunk in enumerate(bm25_ranked, start=1):
            chunk_id = self._chunk_id(chunk)

            if chunk_id is None:
                continue

            merged[chunk_id] = {
                **chunk,
                "bm25_rank": rank,
                "vector_rank": None,
                "rrf_score": self._rrf_score(rank),
            }

        for rank, chunk in enumerate(vector_ranked, start=1):
            chunk_id = self._chunk_id(chunk)

            if chunk_id is None:
                continue

            if chunk_id in merged:
                item = merged[chunk_id]
                item["vector_rank"] = rank
                item["rrf_score"] += self._rrf_score(rank)

                # Giữ nguyên distance thực tế từ vector search.
                if chunk.get("distance") is not None:
                    item["distance"] = chunk["distance"]

                # Bổ sung trường nếu kết quả vector có dữ liệu
                # mà kết quả BM25 không có.
                for key, value in chunk.items():
                    if item.get(key) is None and value is not None:
                        item[key] = value
            else:
                merged[chunk_id] = {
                    **chunk,
                    "bm25_rank": None,
                    "vector_rank": rank,
                    "rrf_score": self._rrf_score(rank),
                }

        # 5. Tăng nhẹ thứ hạng cho chunk chứa thuật ngữ truy vấn.
        # Đây là điểm bổ sung cho thứ hạng, không thay thế RRF
        # và không được sử dụng như vector similarity.
        query_term_set = set(query_tokens)

        for item in merged.values():
            chunk_tokens = set(
                tokenize(self._searchable_text(item))
            )

            matched_terms = query_term_set & chunk_tokens
            item["retrieval_matched_terms"] = sorted(matched_terms)

            # Điểm cộng giới hạn để không lấn át hoàn toàn RRF.
            item["term_match_score"] = (
                len(matched_terms) / len(query_term_set)
                if query_term_set
                else 0.0
            )

            item["final_rank_score"] = (
                item["rrf_score"]
                + 0.01 * item["term_match_score"]
            )

        ranked = sorted(
            merged.values(),
            key=lambda item: (
                item["final_rank_score"],
                item["rrf_score"],
            ),
            reverse=True,
        )

        return ranked[:top_k]
