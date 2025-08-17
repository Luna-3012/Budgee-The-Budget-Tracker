import os
import time
import logging
from dotenv import load_dotenv
from pinecone import Pinecone, ServerlessSpec

load_dotenv()
logger = logging.getLogger(__name__)

class PineconeManager:
    def __init__(self):
        self.api_key = os.getenv("PINECONE_API_KEY")
        self.index_name = os.getenv("PINECONE_INDEX_NAME", "budget-bot")
        self.pc = None
        self.index = None

        if not self.api_key:
            logger.error("❌ Pinecone API key not provided")
            return

        try:
            self.pc = Pinecone(api_key=self.api_key)
            logger.info("✅ Pinecone client initialized")
            self._setup_index()
        except Exception as e:
            logger.error(f"❌ Failed to initialize Pinecone client: {e}")

    def _setup_index(self):
        try:
            # FIX: extract names properly
            existing_indexes = [idx.name for idx in self.pc.list_indexes()]
            logger.info(f"📂 Existing indexes: {existing_indexes}")

            if self.index_name not in existing_indexes:
                logger.info(f"🆕 Creating new index '{self.index_name}'...")
                self._create_index()
            else:
                logger.info(f"🔗 Connecting to existing index '{self.index_name}'...")
                self.index = self.pc.Index(self.index_name)

            if self.index:
                stats = self.index.describe_index_stats()
                logger.info(f"📊 Connected to index. Stats: {stats}")

        except Exception as e:
            logger.error(f"❌ Error setting up index: {e}")
            self.index = None

    def _create_index(self):
        try:
            spec = ServerlessSpec(cloud="aws", region="us-east-1")

            self.pc.create_index(
                name=self.index_name,
                dimension=1536,
                metric="cosine",
                spec=spec
            )
            logger.info(f"✅ Created index '{self.index_name}'")

            # Wait until ready
            while True:
                index_status = self.pc.describe_index(self.index_name)
                if index_status.status.get("ready", False):
                    break
                time.sleep(2)

            self.index = self.pc.Index(self.index_name)
            logger.info("🎯 Index is ready for use")

        except Exception as e:
            logger.error(f"❌ Failed to create index: {e}")
            self.index = None

    def get_index(self):
        return self.index

    def is_available(self):
        return self.index is not None

    def test_connection(self):
        if not self.index:
            return {"status": "error", "message": "Index not available"}

        try:
            stats = self.index.describe_index_stats()
            return {"status": "success", "stats": stats}
        except Exception as e:
            return {"status": "error", "message": str(e)}


# Global instance
pinecone_manager = PineconeManager()
