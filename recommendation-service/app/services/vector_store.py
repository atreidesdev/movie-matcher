import faiss
import numpy as np
from typing import List, Dict, Tuple, Optional
import logging
import pickle
from pathlib import Path

from app.config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()


class VectorStore:
    """FAISS-based vector store for media embeddings."""

    def __init__(self):
        self.dimension = settings.vector_dim
        self.index = faiss.IndexFlatIP(self.dimension)
        self.id_map: Dict[int, Dict] = {}
        self.next_idx = 0
        self._data_dir = Path("data")
        self._data_dir.mkdir(exist_ok=True)

    def add_embedding(
        self,
        media_id: int,
        media_type: str,
        title: str,
        embedding: np.ndarray,
        metadata: Optional[Dict] = None
    ):
        """Add a single embedding to the index."""
        embedding = embedding.reshape(1, -1).astype('float32')

        self.index.add(embedding)

        self.id_map[self.next_idx] = {
            "media_id": media_id,
            "media_type": media_type,
            "title": title,
            "metadata": metadata or {}
        }
        self.next_idx += 1

    def add_embeddings_batch(
        self,
        items: List[Dict]
    ):
        """Add multiple embeddings to the index."""
        if not items:
            return

        embeddings = np.array([item["embedding"] for item in items]).astype('float32')

        self.index.add(embeddings)

        for item in items:
            self.id_map[self.next_idx] = {
                "media_id": item["media_id"],
                "media_type": item["media_type"],
                "title": item["title"],
                "metadata": item.get("metadata", {})
            }
            self.next_idx += 1

    def search(
        self,
        query_embedding: np.ndarray,
        k: int = 10,
        media_type: Optional[str] = None,
        exclude_ids: Optional[List[int]] = None
    ) -> List[Tuple[Dict, float]]:
        """Search for similar items in the index."""
        if self.index.ntotal == 0:
            return []

        query_embedding = query_embedding.reshape(1, -1).astype('float32')

        search_k = min(k * 3, self.index.ntotal)
        distances, indices = self.index.search(query_embedding, search_k)

        results = []
        exclude_ids = exclude_ids or []

        for idx, score in zip(indices[0], distances[0]):
            if idx == -1:
                continue

            item = self.id_map.get(idx)
            if item is None:
                continue

            if item["media_id"] in exclude_ids:
                continue

            if media_type and item["media_type"] != media_type:
                continue

            results.append((item, float(score)))

            if len(results) >= k:
                break

        return results

    def get_size(self) -> int:
        """Return the number of vectors in the index."""
        return self.index.ntotal

    def save(self, filename: str = "vector_store"):
        """Save the index and metadata to disk."""
        index_path = self._data_dir / f"{filename}.index"
        meta_path = self._data_dir / f"{filename}.meta"

        faiss.write_index(self.index, str(index_path))

        with open(meta_path, 'wb') as f:
            pickle.dump({
                "id_map": self.id_map,
                "next_idx": self.next_idx
            }, f)

        logger.info(f"Saved vector store with {self.index.ntotal} vectors")

    def load(self, filename: str = "vector_store") -> bool:
        """Load the index and metadata from disk."""
        index_path = self._data_dir / f"{filename}.index"
        meta_path = self._data_dir / f"{filename}.meta"

        if not index_path.exists() or not meta_path.exists():
            return False

        try:
            self.index = faiss.read_index(str(index_path))

            with open(meta_path, 'rb') as f:
                data = pickle.load(f)
                self.id_map = data["id_map"]
                self.next_idx = data["next_idx"]

            logger.info(f"Loaded vector store with {self.index.ntotal} vectors")
            return True
        except Exception as e:
            logger.error(f"Failed to load vector store: {e}")
            return False

    def clear(self):
        """Clear the index."""
        self.index = faiss.IndexFlatIP(self.dimension)
        self.id_map = {}
        self.next_idx = 0


_vector_store: Optional[VectorStore] = None


def get_vector_store() -> VectorStore:
    global _vector_store
    if _vector_store is None:
        _vector_store = VectorStore()
        if not settings.use_mock_data:
            _vector_store.load()
    return _vector_store
