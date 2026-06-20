from flask import Blueprint, request, jsonify, g
from backend.auth.services import AuthService
from backend.middleware import token_required

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "user")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    response, status_code = AuthService.register_user(email, password, role)
    return jsonify(response), status_code

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    response, status_code = AuthService.login_user(email, password)
    return jsonify(response), status_code

@auth_bp.route("/profile", methods=["GET"])
@token_required
def profile():
    response, status_code = AuthService.get_user_profile(g.user_id)
    return jsonify(response), status_code

@auth_bp.route("/logout", methods=["POST"])
def logout():
    # Since we use stateless JWTs, the client simply deletes the token.
    # We return a success message acknowledging logout.
    return jsonify({"message": "Logout successful"}), 200
