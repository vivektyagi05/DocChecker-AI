import sys
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from config import Config

class Database:
    _client = None
    db = None

    @classmethod
    def connect(cls):
        if cls._client is None:
            try:
                cls._client = MongoClient(Config.MONGO_URI, serverSelectionTimeoutMS=5000)
                # Force a connection check
                cls._client.admin.command("ping")
                cls.db = cls._client[Config.DB_NAME]
                print(f"Successfully connected to MongoDB: {Config.DB_NAME}")
                cls._create_indexes()
            except ConnectionFailure as e:
                print(f"Could not connect to MongoDB: {e}")
                sys.exit(1)
        return cls.db

    @classmethod
    def _create_indexes(cls):
        # Users indexes
        cls.db.users.create_index("email", unique=True)
        # Documents indexes
        cls.db.documents.create_index("user_id")
        cls.db.documents.create_index("created_at")
        # Chat indexes
        cls.db.chat_messages.create_index([("document_id", 1), ("timestamp", 1)])
        print("Database indexes initialized.")

# Single entrypoint database client
db_client = Database
