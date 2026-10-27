
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Jlearn AI Tutor"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = "development"
    API_PREFIX: str = "/v1"

    # Gemini
    GEMINI_API_KEY: str
    GEMINI_MODEL: str = "gemini-3.5-flash"
    GEMINI_EMBEDDING_MODEL: str = "gemini-embedding-001"

    # Course Service
    COURSE_SERVICE_BASE_URL: str = "http://localhost:8083"

    # ChromaDB
    CHROMA_PATH: str = "./data/chroma"
    CHROMA_COLLECTION: str = "jlearn_knowledge"
    KNOWLEDGE_PATH: str = "./knowledge"

    # MongoDB
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DATABASE: str = "jlearn_ai_tutor"

    # Knowledge synchronization
    SYNC_INTERVAL_SECONDS: int = 300

    # Authentication
    AUTH_INTROSPECT_URL: str = "http://localhost:8081/auth/introspect"
    JWT_SIGNER_KEY: str
    JWT_ISSUER: str = "jlearn"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
