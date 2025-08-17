from typing import List, Dict, Tuple
import logging
import hashlib
import json
from .pinecone_manager import pinecone_manager

logger = logging.getLogger(__name__)

# Get the index from the manager
index = pinecone_manager.get_index()

if index:
    logger.info("Pinecone index available")
else:
    logger.warning("Pinecone index not available - vector search disabled")

def build_docs_from_expenses(expenses: List[dict]) -> Tuple[List[str], List[str], List[Dict]]:
    texts = []
    ids = []
    metadata = []
    for e in expenses:
        text = f"Date: {e['date']}, Amount: ₹{e['amount']:.2f}, Category: {e['category']}, Description: {e['description']}"
        texts.append(text)
        # Generate a unique ID if expense_id doesn't exist
        expense_id = e.get('expense_id') or f"{e['user_id']}_{e['date']}_{e['amount']}_{e['category']}"
        ids.append(expense_id) 
        metadata.append({
            "user_id": e["user_id"], 
            "date": e["date"], 
            "category": e["category"],
            "amount": e["amount"],
            "text": text  
        })
    return texts, ids, metadata

def upsert_expenses_to_pinecone(expenses: List[Dict]) -> None:
    if not expenses:
        return
    
    if index is None:
        logger.warning("Pinecone index not available, skipping upsert")
        return
    
    user_ids = {e['user_id'] for e in expenses}
    if len(user_ids) != 1:
        raise ValueError("All expenses to upsert must belong to the same user_id.")
    
    texts, ids, metadata = build_docs_from_expenses(expenses)
    
    try:
        # Create vectors using simple hash-based approach
        vectors = []
        for text, idx, meta in zip(texts, ids, metadata):
            vector = text
            vectors.append({
                "id": idx,
                "values": vector,
                "metadata": meta
            })
        
        # Use the correct Pinecone API format
        if hasattr(index, 'upsert'):
            # Try the new API format first
            try:
                index.upsert(vectors=vectors)
                logger.info(f"Successfully upserted {len(expenses)} expenses to Pinecone")
            except TypeError:
                # Fallback to old API format
                try:
                    index.upsert(records=vectors)
                    logger.info(f"Successfully upserted {len(expenses)} expenses to Pinecone (legacy API)")
                except Exception as e:
                    logger.error(f"Failed to upsert with legacy API: {e}")
        else:
            logger.warning("Pinecone index does not have upsert method")
            
    except Exception as e:
        logger.error(f"Error during Pinecone upsert: {e}")