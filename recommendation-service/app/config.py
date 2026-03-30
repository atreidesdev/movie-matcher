from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:postgres@localhost:5432/movie_matcher"
    embedding_model: str = "all-MiniLM-L6-v2"
    vector_dim: int = 384
    use_faiss: bool = True
    host: str = "0.0.0.0"
    port: int = 8000

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
