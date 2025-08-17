# config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Pinecone Configuration
    PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
    PINECONE_CLOUD = os.getenv("PINECONE_CLOUD", "aws")
    PINECONE_REGION = os.getenv("PINECONE_REGION", "us-east-1")
    
    # FinGPT Configuration
    HF_API_TOKEN=os.getenv("HF_API_TOKEN")
    HF_MODEL=os.getenv("HF_MODEL")
    HF_API_URL=os.getenv("HF_API_URL")
 
    # Pinecone Index Configuration
    INDEX_NAME = os.getenv("INDEX_NAME", "budget-bot")
    NAMESPACE = os.getenv("NAMESPACE", "user_expenses")
    
    # Vector Configuration
    EMBEDDING_MODEL = "multilingual-e5-large"
    EMBEDDING_DIMENSION = 1024
    
    # FastAPI Configuration
    API_HOST = "0.0.0.0"
    API_PORT = 8000
    DEBUG_MODE = os.getenv("DEBUG", "false").lower() == "true"
    
    @classmethod
    def validate_config(cls):
        """Validate that required environment variables are set"""
        required_vars = [
            "PINECONE_API_KEY",
            "HF_API_TOKEN",
            "HF_MODEL"
        ]
        
        missing_vars = []
        for var in required_vars:
            if not getattr(cls, var):
                missing_vars.append(var)
        
        if missing_vars:
            raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")
        
        return True

config = Config()
