from typing import List, Dict, Optional
from cachetools import TTLCache, cached
from .query_filter import extract_filters_from_query
import logging

logger = logging.getLogger(__name__)
query_cache = TTLCache(maxsize=100, ttl=300)

@cached(query_cache)
def query_user_expenses(index, user_id: str, query: str, top_k: int = 5) -> List[Dict]:
    if index is None:
        logger.warning("Pinecone index not available, returning empty results")
        return []
    
    filter_criteria = {"user_id": {"$eq": user_id}}

    filters = extract_filters_from_query(query, user_id)

    start_date = filters.get("start_date")
    end_date = filters.get("end_date")
    if start_date and end_date:
        filter_criteria["date"] = {"$gte": start_date, "$lte": end_date}
    
    keywords = filters.get("keywords")
    query_text = query
    if keywords:
        query_text = query + " " + " ".join(keywords)
    
    try:
        if hasattr(index, 'query'):
            try:
                results = index.query(
                    vector=query_text,
                    top_k=top_k,
                    filter=filter_criteria,
                    include_metadata=True
                )
                return results.get('matches', [])
            except TypeError:
                # Fallback to old API format
                try:
                    results = index.query(
                        vector=query_text,
                        top_k=top_k,
                        filter=filter_criteria,
                        include_metadata=True
                    )
                    return results.get('matches', [])
                except Exception as e:
                    logger.error(f"Failed to query with legacy API: {e}")
                    return []
        else:
            logger.warning("Pinecone index does not have query method")
            return []
            
    except Exception as e:
        logger.error(f"Error querying Pinecone: {e}")
        return []


def format_context_from_results(results: List[Dict]) -> str:
    if not results:
        return "No relevant expense data found for your query."

    context_lines = []
    for match in results:
        meta = match.get('metadata', {})
        text = meta.get('text') or meta.get('chunk_text') or meta.get('description') or ""
        if text:
            context_lines.append(text)

    if not context_lines:
        return "No relevant expense data found for your query."

    return "\n".join(context_lines)
    