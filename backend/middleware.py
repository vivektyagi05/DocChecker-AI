from functools import wraps
import jwt
from flask import request, jsonify, g
from config import Config
from backend.models.database import db_client

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # Check Authorization header
        if "Authorization" in request.headers:
            auth_header = request.headers["Authorization"].split(" ")
            if len(auth_header) == 2 and auth_header[0] == "Bearer":
                token = auth_header[1]

        if not token:
            return jsonify({"error": "Token is missing"}), 401

        try:
            db = db_client.connect()
            data = jwt.decode(token, Config.JWT_SECRET, algorithms=["HS256"])
            # Validate user exists in DB
            from bson import ObjectId
            user = db.users.find_one({"_id": ObjectId(data["user_id"])})
            if not user:
                return jsonify({"error": "Invalid or expired token"}), 401
            
            # Attach user details to request context g
            g.user_id = str(user["_id"])
            g.user_email = user["email"]
            g.user_role = user.get("role", "user")
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except (jwt.InvalidTokenError, Exception) as e:
            return jsonify({"error": f"Invalid token: {str(e)}"}), 401

        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # Must be run after @token_required
        role = getattr(g, "user_role", "user")
        if role != "admin":
            return jsonify({"error": "Admin privileges required"}), 403
        return f(*args, **kwargs)
    return decorated
