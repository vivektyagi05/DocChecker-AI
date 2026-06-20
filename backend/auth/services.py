import datetime
import bcrypt
import jwt
from bson import ObjectId
from config import Config
from backend.models.database import db_client

class AuthService:
    @staticmethod
    def register_user(email, password, role=None):
        db = db_client.connect()
        # Check if user already exists
        if db.users.find_one({"email": email}):
            return {"error": "User with this email already exists"}, 400

        # First user becomes admin, subsequent users become regular users
        if role is None:
            user_count = db.users.count_documents({})
            role = "admin" if user_count == 0 else "user"

        # Hash password
        salt = bcrypt.gensalt()
        password_hash = bcrypt.hashpw(password.encode("utf-8"), salt)

        # Insert user
        user_doc = {
            "email": email,
            "password_hash": password_hash,
            "role": role,
            "doc_quota": 5,
            "created_at": datetime.datetime.utcnow()
        }
        result = db.users.insert_one(user_doc)
        
        # Generate token
        token = AuthService._generate_token(str(result.inserted_id), role)
        return {
            "message": "User registered successfully",
            "token": token,
            "user": {
                "id": str(result.inserted_id),
                "email": email,
                "role": role,
                "doc_quota": 5
            }
        }, 201

    @staticmethod
    def login_user(email, password):
        db = db_client.connect()
        user = db.users.find_one({"email": email})
        if not user:
            return {"error": "Invalid email or password"}, 401

        # Check password hash
        if not bcrypt.checkpw(password.encode("utf-8"), user["password_hash"]):
            return {"error": "Invalid email or password"}, 401

        # Generate token
        token = AuthService._generate_token(str(user["_id"]), user.get("role", "user"))
        return {
            "message": "Login successful",
            "token": token,
            "user": {
                "id": str(user["_id"]),
                "email": user["email"],
                "role": user.get("role", "user")
            }
        }, 200

    @staticmethod
    def get_user_profile(user_id):
        db = db_client.connect()
        user = db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            return {"error": "User not found"}, 404

        return {
            "user": {
                "id": str(user["_id"]),
                "email": user["email"],
                "role": user.get("role", "user"),
                "doc_quota": user.get("doc_quota", 5),
                "created_at": user.get("created_at")
            }
        }, 200

    @staticmethod
    def _generate_token(user_id, role):
        payload = {
            "user_id": user_id,
            "role": role,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }
        return jwt.encode(payload, Config.JWT_SECRET, algorithm="HS256")
