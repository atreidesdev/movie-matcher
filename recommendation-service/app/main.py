from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
import logging
from prometheus_client import REGISTRY, generate_latest, CONTENT_TYPE_LATEST

from app.config import get_settings
from app.middleware.metrics import PrometheusMiddleware
from app.models.schemas import RecommendationResponse, SimilarResponse, SimilarUsersResponse, HealthResponse, SemanticSearchResponse
from app.services.recommendation_service import get_recommendation_service
from app.services.vector_store import get_vector_store
from app.services import similar_compute

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

settings = get_settings()

app = FastAPI(
    title="Movie Matcher Recommendation Service",
    description="Vector-based recommendation engine for media content",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(PrometheusMiddleware)


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    logger.info("Starting recommendation service...")
    if settings.use_mock_data:
        from app.services import demo_loader
        demo_loader.load_and_index()
        logger.info("Demo mode: loaded mock data from fixtures (no DB required)")
    get_recommendation_service()
    logger.info("Recommendation service started successfully")


@app.get("/metrics", include_in_schema=False)
def metrics():
    """Prometheus-метрики: число запросов и длительность по endpoint."""
    return Response(content=generate_latest(REGISTRY), media_type=CONTENT_TYPE_LATEST)


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    vector_store = get_vector_store()
    return HealthResponse(
        status="healthy",
        embedding_model=settings.embedding_model,
        index_size=vector_store.get_size()
    )


@app.get("/recommendations/{user_id}", response_model=RecommendationResponse)
async def get_recommendations(
    user_id: int,
    media_type: str = Query("movie", description="Type of media to recommend"),
    limit: int = Query(10, ge=1, le=50, description="Number of recommendations")
):
    """
    Get personalized recommendations for a user.
    
    Recommendations are based on:
    - User's rating history
    - Genres of highly-rated content
    - Vector similarity using sentence-transformers
    """
    try:
        service = get_recommendation_service()
        return service.get_recommendations(
            user_id=user_id,
            media_type=media_type,
            limit=limit
        )
    except Exception as e:
        logger.error(f"Error getting recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/similar/{media_type}/{media_id}", response_model=SimilarResponse)
async def get_similar(
    media_type: str,
    media_id: str,
    limit: int = Query(10, ge=1, le=50, description="Number of similar items")
):
    """
    Get similar media items based on content similarity.
    
    Uses vector embeddings to find semantically similar content.
    """
    try:
        service = get_recommendation_service()
        return service.get_similar(
            media_id=media_id,
            media_type=media_type,
            limit=limit
        )
    except Exception as e:
        logger.error(f"Error getting similar items: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/similar/users/{user_id}", response_model=SimilarUsersResponse)
async def get_similar_users(
    user_id: int,
    limit: int = Query(20, ge=1, le=50, description="Number of similar users")
):
    """
    Get users with similar taste (overlap in lists and ratings).
    """
    try:
        service = get_recommendation_service()
        return service.get_similar_users(user_id=user_id, limit=limit)
    except Exception as e:
        logger.error(f"Error getting similar users: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/index/{media_type}")
async def index_media(
    media_type: str,
    batch_size: int = Query(100, ge=10, le=1000)
):
    """
    Index all media of a specific type from the database.
    In demo mode (USE_MOCK_DATA=true) index is already filled from fixtures; this is a no-op.
    """
    if settings.use_mock_data:
        return {"status": "success", "message": "Demo mode: index already loaded from fixtures"}
    try:
        service = get_recommendation_service()
        service.index_media(media_type=media_type, batch_size=batch_size)
        return {"status": "success", "message": f"Indexed {media_type} items"}
    except Exception as e:
        logger.error(f"Error indexing media: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/similar/compute")
async def compute_similar(
    media_type: str = Query(None, description="Optional: compute only for this media type (e.g. movie, tv_series)")
):
    """
    Compute and store similar items in DB (content_similar).
    Not available in demo mode (USE_MOCK_DATA=true).
    """
    if settings.use_mock_data:
        raise HTTPException(status_code=400, detail="Not available in demo mode (no database)")
    try:
        similar_compute.compute_all_similar(media_type=media_type)
        return {"status": "success", "message": f"Similar computed" + (f" for {media_type}" if media_type else " for all types")}
    except Exception as e:
        logger.error(f"Error computing similar: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/search/semantic", response_model=SemanticSearchResponse)
async def semantic_search(
    q: str = Query(..., min_length=1, description="Search query (by meaning/description)"),
    media_type: Optional[str] = Query(None, description="Filter by media type (movie, anime, game, etc.)"),
    limit: int = Query(20, ge=1, le=50, description="Max number of results"),
):
    """
    Semantic search: find media by meaning of the query (description, themes, mood).
    Uses vector embeddings; results are ordered by similarity to the query.
    """
    try:
        service = get_recommendation_service()
        return service.search_by_query(query=q, media_type=media_type, limit=limit)
    except Exception as e:
        logger.error(f"Error in semantic search: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/index")
async def clear_index():
    """Clear the vector index."""
    try:
        vector_store = get_vector_store()
        vector_store.clear()
        return {"status": "success", "message": "Index cleared"}
    except Exception as e:
        logger.error(f"Error clearing index: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=True
    )
