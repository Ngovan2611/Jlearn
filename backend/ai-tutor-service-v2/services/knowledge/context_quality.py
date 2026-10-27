
import re

from services.knowledge.retrieval_service import (
    normalize_text,
    tokenize,
)


# =========================================================
# CONFIGURATION
# =========================================================

PHRASE_ALIASES = {
    "bao ve": "baove",
    "bao mat": "baomat",
    "xac thuc": "xacthuc",
    "phan quyen": "phanquyen",
    "co so du lieu": "cosodulieu",
    "truy van": "truyvan",
}

TERM_CANONICAL = {
    "indexes": "index",
    "indexing": "index",
    "queries": "query",
}

STOP_WORDS = {
    "la", "gi", "nhu", "the", "nao", "de", "lam", "dung",
    "co", "cua", "va", "trong", "mot", "cac", "nhung",
    "hoat", "dong", "duoc", "voi", "khi", "thi", "nay",
    "do", "hien", "tai", "jlearn", "sao", "nen", "hay",
    "giua", "bang", "cho", "theo", "su", "khac", "biet",
    "ve", "cach", "tai", "thay", "vi", "giai", "thich",
    "tra", "toi", "uu", "cau", "hoi", "nhat",
}

GENERIC_TERMS = {
    "java", "spring", "boot", "api", "application",
    "use", "using", "lam", "sao", "the", "nao",
}

TOPIC_GROUPS = {
    "security": {
        "security", "jwt", "token", "authentication",
        "authorization", "authenticate", "authorize",
        "baomat", "baove", "xacthuc", "phanquyen",
        "bcrypt", "onceperrequestfilter", "filterchain",
        "bearer", "passwordencoder", "csrf",
    },
        "spring": {
        "spring", "springboot", "ioc", "bean", "beans",
        "autowired", "dependency", "injection",
        "dependencyinjection", "constructorinjection",
        "component", "componentscan", "qualifier", "lazy",
    },
        "rest_api": {
        "api", "rest", "restful", "endpoint", "http", "get",
        "post", "put", "patch", "delete", "dto",
        "entity", "validation", "valid", "request",
        "response", "resource", "controller",
    },
    "database": {
        "sql", "mysql", "database", "index",
        "query", "hibernate", "jpa", "join", "fetch",
        "truyvan", "dulieu", "csdl", "cosodulieu",
        "explain", "queryplan",
    },
    "java_oop": {
        "oop", "class", "object", "interface", "abstract",
        "inheritance", "polymorphism", "encapsulation",
        "ke", "thua", "truu", "tuong", "daphinh",
    },
    "microservices": {
        "microservices", "gateway", "eureka", "openfeign",
        "discovery", "routing",
    },
}

IMPORTANT_TERMS = {
    "dto", "entity", "put", "patch", "get", "post",
    "delete", "jwt", "security", "sql", "index",
    "hibernate", "jpa",
}

REQUIRED_TERM_PAIRS = (
    {"put", "patch"},
    {"dto", "entity"},
)


# =========================================================
# TERM NORMALIZATION
# =========================================================

def normalize_term(term: str) -> str:
    """Normalize a technical term and resolve known aliases."""
    term = normalize_text(term).strip()
    term = re.sub(r"[^a-z0-9_+#.]", "", term)
    term = term.strip(".")

    return TERM_CANONICAL.get(term, term)


def normalize_phrases(text: str) -> str:
    """Normalize Vietnamese text and replace known phrases."""
    normalized = normalize_text(text)

    for phrase, alias in PHRASE_ALIASES.items():
        normalized = re.sub(
            rf"(?<!\w){re.escape(phrase)}(?!\w)",
            alias,
            normalized,
        )

    return normalized


def extract_terms(text: str) -> set[str]:
    """Extract normalized terms from a question or chunk."""
    normalized = normalize_phrases(text)

    terms = {
        normalize_term(term)
        for term in tokenize(normalized)
    }

    technical_terms = (
        set().union(*TOPIC_GROUPS.values())
        | IMPORTANT_TERMS
        | set(PHRASE_ALIASES.values())
    )

    for term in technical_terms:
        canonical = normalize_term(term)

        if not canonical:
            continue

        if re.search(
            rf"(?<![a-z0-9_]){re.escape(canonical)}(?![a-z0-9_])",
            normalized,
        ):
            terms.add(canonical)

    return terms - {""}


# =========================================================
# TOPIC DETECTION
# =========================================================

def get_topic_groups(terms: set[str]) -> set[str]:
    """Detect topic groups from normalized terms."""
    return {
        topic
        for topic, keywords in TOPIC_GROUPS.items()
        if terms & keywords
    }


def get_required_pairs(query_terms: set[str]) -> list[set[str]]:
    """Return required technical term pairs present in the query."""
    return [
        pair
        for pair in REQUIRED_TERM_PAIRS
        if pair.issubset(query_terms)
    ]


# =========================================================
# CONTEXT QUALITY EVALUATOR
# =========================================================

class ContextQualityEvaluator:
    def __init__(
        self,
        min_matched_terms: int = 1,
        min_coverage: float = 0.25,
        min_topic_overlap: float = 0.5,
        min_vector_similarity: float = 0.15,
    ):
        self.min_matched_terms = min_matched_terms
        self.min_coverage = min_coverage
        self.min_topic_overlap = min_topic_overlap
        self.min_vector_similarity = min_vector_similarity

    @staticmethod
    def _failure(
        query_terms: set[str],
        query_topics: set[str] | None = None,
        reason: str = "Ngữ cảnh chưa đạt điều kiện chất lượng.",
    ) -> dict:
        return {
            "sufficient": False,
            "coverage": 0.0,
            "matched_terms": 0,
            "query_terms": len(query_terms),
            "query_topics": sorted(query_topics or set()),
            "relevant_chunks": [],
            "reason": reason,
        }

    @staticmethod
    def _searchable_text(chunk: dict) -> str:
        """Combine metadata and content for relevance evaluation."""
        metadata = chunk.get("metadata") or {}

        return " ".join(
            str(value or "")
            for value in (
                metadata.get("course_title", ""),
                metadata.get("lesson_title", ""),
                metadata.get("description", ""),
                chunk.get("content", ""),
            )
        )

    @staticmethod
    def _get_vector_similarity(chunk: dict) -> float | None:
        """
        Use an actual cosine similarity when available.
        ChromaDB cosine distance is converted using 1 - distance.
        Never use an RRF score as vector similarity.
        """
        similarity = chunk.get("vector_similarity")

        if similarity is not None:
            return float(similarity)

        distance = chunk.get("distance")

        if distance is None:
            return None

        return 1.0 - float(distance)

    def evaluate(
        self,
        question: str,
        chunks: list[dict],
    ) -> dict:
        query_terms = extract_terms(question) - STOP_WORDS
        meaningful_terms = query_terms - GENERIC_TERMS

        # Với câu hỏi định nghĩa ngắn như "API là gì?",
        # giữ lại thuật ngữ gốc nếu việc lọc làm rỗng truy vấn.
        if not meaningful_terms:
            meaningful_terms = query_terms

        if not meaningful_terms:
            return self._failure(
                query_terms,
                reason="Câu hỏi không có đủ thuật ngữ đặc trưng.",
            )

        if not chunks:
            return self._failure(
                meaningful_terms,
                reason="Không tìm thấy chunk kiến thức.",
            )

        query_topics = get_topic_groups(meaningful_terms)
        important_query_terms = meaningful_terms & IMPORTANT_TERMS
        required_pairs = get_required_pairs(meaningful_terms)

        evaluated_chunks = []

        for chunk in chunks:
            metadata = chunk.get("metadata") or {}
            searchable_text = self._searchable_text(chunk)
            chunk_terms = extract_terms(searchable_text)

            matched_terms = meaningful_terms & chunk_terms
            important_match_terms = important_query_terms & chunk_terms

            coverage = (
                len(matched_terms) / len(meaningful_terms)
                if meaningful_terms
                else 0.0
            )

            chunk_topics = get_topic_groups(chunk_terms)

            topic_overlap = (
                len(query_topics & chunk_topics) / len(query_topics)
                if query_topics
                else 0.0
            )

            vector_similarity = self._get_vector_similarity(chunk)

            vector_pass = (
                vector_similarity is not None
                and vector_similarity >= self.min_vector_similarity
            )

            if not query_topics:
                topic_pass = True
                topic_status = "not_applicable"
            else:
                topic_pass = (
                    bool(query_topics & chunk_topics)
                    and topic_overlap >= self.min_topic_overlap
                )
                topic_status = (
                    "matched" if topic_pass else "mismatch"
                )

            # Important terms must match the chunk explicitly.
            # Topic overlap alone must not bypass this condition.
            if important_query_terms:
                lexical_pass = bool(important_match_terms)
            else:
                lexical_pass = (
                    len(matched_terms)
                    >= min(
                        self.min_matched_terms,
                        len(meaningful_terms),
                    )
                    and coverage >= self.min_coverage
                )

            accepted = (
                lexical_pass
                and topic_pass
                and vector_pass
            )

            if not lexical_pass:
                reject_reason = "lexical_mismatch"
            elif not topic_pass:
                reject_reason = "topic_mismatch"
            elif not vector_pass:
                reject_reason = "vector_similarity_too_low"
            else:
                reject_reason = None

            evaluated = {
                **chunk,
                "_quality_terms": chunk_terms,
                "matched_terms": sorted(matched_terms),
                "important_match_terms": sorted(
                    important_match_terms
                ),
                "coverage": coverage,
                "query_topics": sorted(query_topics),
                "chunk_topics": sorted(chunk_topics),
                "topic_overlap": topic_overlap,
                "vector_similarity": vector_similarity,
                "important_match": bool(important_match_terms),
                "lexical_pass": lexical_pass,
                "topic_pass": topic_pass,
                "vector_pass": vector_pass,
                "quality_accepted": accepted,
                "quality_reject_reason": reject_reason,
            }

            evaluated_chunks.append(evaluated)


        relevant_chunks = [
            item
            for item in evaluated_chunks
            if item["quality_accepted"]
        ]

        relevant_chunks.sort(
            key=lambda item: (
                len(item["matched_terms"]),
                item["coverage"],
                item["topic_overlap"],
                (
                    item["vector_similarity"]
                    if item["vector_similarity"] is not None
                    else -1.0
                ),
            ),
            reverse=True,
        )

        # Validate required pairs across accepted context chunks.
        for required_pair in required_pairs:
            pair_topic = (
                "rest_api"
                if required_pair & TOPIC_GROUPS["rest_api"]
                else None
            )

            pair_chunks = [
                item
                for item in relevant_chunks
                if (
                    pair_topic is None
                    or pair_topic in item["chunk_topics"]
                )
            ]

            context_terms = (
                set().union(
                    *(item["_quality_terms"] for item in pair_chunks)
                )
                if pair_chunks
                else set()
            )

            if not required_pair.issubset(context_terms):
                return {
                    "sufficient": False,
                    "coverage": 0.0,
                    "matched_terms": 0,
                    "query_terms": len(meaningful_terms),
                    "query_topics": sorted(query_topics),
                    "relevant_chunks": [],
                    "reason": (
                        "Context chưa có đủ thuật ngữ: "
                        + " và ".join(sorted(required_pair))
                    ),
                }

        if not relevant_chunks:
            best = max(
                evaluated_chunks,
                key=lambda item: (
                    len(item["matched_terms"]),
                    item["coverage"],
                    item["topic_overlap"],
                    (
                        item["vector_similarity"]
                        if item["vector_similarity"] is not None
                        else -1.0
                    ),
                ),
            )

            return {
                "sufficient": False,
                "coverage": round(best["coverage"], 3),
                "matched_terms": len(best["matched_terms"]),
                "query_terms": len(meaningful_terms),
                "query_topics": sorted(query_topics),
                "relevant_chunks": [],
                "reason": (
                    "Không có chunk nào đạt đồng thời điều kiện "
                    "thuật ngữ, chủ đề và độ tương đồng. "
                    f"Chunk tốt nhất bị loại do: "
                    f"{best['quality_reject_reason']}."
                ),
            }

        clean_chunks = [
            {
                key: value
                for key, value in item.items()
                if key != "_quality_terms"
            }
            for item in relevant_chunks
        ]

        best = relevant_chunks[0]

        return {
            "sufficient": True,
            "coverage": round(best["coverage"], 3),
            "matched_terms": len(best["matched_terms"]),
            "query_terms": len(meaningful_terms),
            "query_topics": sorted(query_topics),
            "relevant_chunks": clean_chunks,
            "reason": "Tìm thấy chunk phù hợp với câu hỏi.",
        }
