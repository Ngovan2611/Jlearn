
from services.knowledge.retrieval_service import RetrievalService
from services.knowledge.context_quality import ContextQualityEvaluator


class KnowledgeEngine:
    def __init__(self):
        self.retrieval_service = RetrievalService()
        self.quality_evaluator = ContextQualityEvaluator()

    def retrieve(
        self,
        question: str,
        course_id: str | None = None,
        lesson_id: str | None = None,
        top_k: int = 4,
    ) -> dict:
        # 1. Tìm kiếm và xếp hạng chunk bằng BM25.
        retrieved_chunks = self.retrieval_service.search(
            question=question,
            course_id=course_id,
            lesson_id=lesson_id,
            top_k=top_k,
        )

        # 2. Đánh giá từng chunk và lấy danh sách chunk phù hợp.
        quality = self.quality_evaluator.evaluate(
            question=question,
            chunks=retrieved_chunks,
        )

        relevant_chunks = quality["relevant_chunks"]

        # 3. Chỉ tạo context từ chunk phù hợp.
        context_parts = []

        for chunk in relevant_chunks:
            metadata = chunk.get("metadata", {})

            course_title = metadata.get("course_title") or metadata.get("course_id") or "Chưa xác định khóa học"
            lesson_title = metadata.get(
                "lesson_title",
                "Chưa xác định bài học",
            )

            context_parts.append(
                f"[Nguồn: {course_title} / {lesson_title}]\n"
                f"{chunk.get('content', '')}"
            )

        context = "\n\n---\n\n".join(context_parts)

        # 4. Lấy nguồn từ các chunk thực sự được sử dụng.
        sources = list(dict.fromkeys(
            chunk.get("metadata", {}).get("source", chunk["id"])
            for chunk in relevant_chunks
        ))

        # Không gửi context rỗng hoặc không đạt chất lượng cho Gemini.
        can_call_gemini = (
            quality["sufficient"]
            and bool(context.strip())
        )

        # Không để dữ liệu nội bộ của evaluator lọt vào response API.
        public_quality = {
            key: value
            for key, value in quality.items()
            if key != "relevant_chunks"
        }

        return {
            "chunks": relevant_chunks,
            "retrieved_count": len(retrieved_chunks),
            "filtered_count": len(retrieved_chunks) - len(relevant_chunks),
            "context": context,
            "sources": sources,
            "quality": public_quality,
            "can_call_gemini": can_call_gemini,
        }
