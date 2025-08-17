from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
import os
import logging
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from .fingpt_queries import query_fingpt 
from .pinecone_manager import pinecone_manager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="BudgetBot API", version="1.0.0")

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Log startup information"""
    logger.info("🚀 BudgetBot Backend starting up...")
    
    # Check Pinecone availability
    if pinecone_manager.is_available():
        logger.info("✅ Pinecone vector search is available")
    else:
        logger.warning("⚠️  Pinecone vector search is not available - using fallback mode")
    
    # Check required environment variables
    hf_token = os.getenv("HF_API_TOKEN")
    if not hf_token or hf_token == "your_huggingface_token_here":
        logger.warning("⚠️  HF_API_TOKEN not configured - FinGPT queries may fail")
    else:
        logger.info("✅ HF_API_TOKEN is configured")

@app.post("/api/query-fingpt")
async def query_fingpt_endpoint(
    question: str = Body(...),
    expenses: List[Dict] = Body(..., embed=True)
):
    try:
        logger.info(f"Received query: {question}")
        logger.info(f"Number of expenses: {len(expenses)}")
        logger.info(f"Expenses data: {expenses[:2]}")  # Log first 2 expenses for debugging
        
        if not expenses:
            logger.warning("No expenses provided")
            return {"error": "No expenses provided to analyze."}
        
        # Validate expense structure
        for i, expense in enumerate(expenses):
            required_fields = ['user_id', 'amount', 'category', 'description', 'date']
            missing_fields = [field for field in required_fields if field not in expense]
            if missing_fields:
                logger.error(f"Expense {i} missing fields: {missing_fields}")
                return {"error": f"Invalid expense data: missing {missing_fields}"}
        
        try:
            logger.info("Calling query_fingpt function...")
            result = query_fingpt(question=question, expenses=expenses)
            logger.info(f"FinGPT result: {result}")
            
            if isinstance(result, dict) and "error" in result:
                logger.error(f"FinGPT returned error: {result['error']}")
                return result
                
            logger.info("Successfully processed query using FinGPT pipeline")
            return result
            
        except Exception as pipeline_error:
            logger.error(f"Pipeline error: {pipeline_error}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            raise HTTPException(
                status_code=500, 
                detail=f"FinGPT processing failed: {str(pipeline_error)}"
            )
        
    except Exception as e:
        logger.error(f"Error processing query: {e}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy", 
        "timestamp": datetime.now().isoformat(),
        "pinecone_available": pinecone_manager.is_available(),
        "hf_token_configured": bool(os.getenv("HF_API_TOKEN") and os.getenv("HF_API_TOKEN") != "your_huggingface_token_here")
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "BudgetBot API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
