import chromadb

from core.config import settings


def main():
    client = chromadb.PersistentClient(
        path=settings.CHROMA_PATH
    )

    collection = client.get_or_create_collection(
        name=settings.CHROMA_COLLECTION
    )

    print("Collection:", collection.name)
    print("Tổng số chunks:", collection.count())

    result = collection.get(
        limit=10,
        include=["documents", "metadatas"],
    )

    for index, chunk_id in enumerate(result["ids"]):
        metadata = result["metadatas"][index] or {}
        document = result["documents"][index] or ""

        print(f"\n--- Chunk {index + 1} ---")
        print("ID:", chunk_id)
        print("course_id:", metadata.get("course_id"))
        print("lesson_id:", metadata.get("lesson_id"))
        print("lesson_title:", metadata.get("lesson_title"))
        print("source:", metadata.get("source"))
        print("Content:", document[:300])


if __name__ == "__main__":
    main()