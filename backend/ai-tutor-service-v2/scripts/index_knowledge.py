import asyncio

from services.knowledge.indexing_service import IndexingService


async def main():
    service = IndexingService()
    result = await service.index_all()

    print("\n========== KẾT QUẢ INDEXING ==========")
    for key, value in result.items():
        print(f"{key}: {value}")


if __name__ == "__main__":
    asyncio.run(main())