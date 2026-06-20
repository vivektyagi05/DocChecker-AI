import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "super-secret-dev-key")
    JWT_SECRET = os.environ.get("JWT_SECRET", "jwt-secret-key-12345")
    MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
    DB_NAME = os.environ.get("DB_NAME", "docchecker_db")
    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
    
    # Upload Configurations
    UPLOAD_FOLDER = os.path.join(os.path.abspath(os.path.dirname(__file__)), "uploads")
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10 MB limit
    ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg"}
