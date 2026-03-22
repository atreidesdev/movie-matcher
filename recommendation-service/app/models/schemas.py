from pydantic import BaseModel
from typing import List, Optional


class RecommendedItem(BaseModel):
    media_id: int
    title: str
    score: float
    poster: Optional[str] = None
    description: Optional[str] = None


class RecommendationResponse(BaseModel):
    recommendations: List[RecommendedItem]
    user_id: int
    media_type: str


class SimilarResponse(BaseModel):
    similar: List[RecommendedItem]
    media_id: str
    media_type: str


class MediaEmbedding(BaseModel):
    media_id: int
    media_type: str
    title: str
    embedding: List[float]


class UserPreferences(BaseModel):
    user_id: int
    favorite_genres: List[str]
    watched_media_ids: List[int]
    ratings: dict


class HealthResponse(BaseModel):
    status: str
    embedding_model: str
    index_size: int


class SemanticSearchItem(BaseModel):
    media_id: int
    media_type: str
    title: str
    score: float
    poster: Optional[str] = None
    description: Optional[str] = None


class SemanticSearchResponse(BaseModel):
    results: List[SemanticSearchItem]


class SimilarUserItem(BaseModel):
    user_id: int
    score: float


class SimilarUsersResponse(BaseModel):
    user_id: int
    similar_users: List[SimilarUserItem]
