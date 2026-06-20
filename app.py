import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from config import Config
from backend.models.database import db_client
from backend.auth.controllers import auth_bp
from backend.documents.controllers import documents_bp

def create_app():
    app = Flask(__name__, static_folder="frontend", static_url_path="")
    
    # Configure app from Config object
    app.config.from_object(Config)

    # Enable CORS for frontend API calls
    CORS(app)

    # Ensure Upload folders exist
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    # Initialize Database Connection
    with app.app_context():
        db_client.connect()

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(documents_bp, url_prefix="/api/documents")

    # Serve Frontend static assets
    @app.route("/")
    def serve_index():
        return send_from_directory("frontend", "index.html")

    @app.route("/<path:path>")
    def serve_static(path):
        return send_from_directory("frontend", path)

    # Global Error Handler
    @app.errorhandler(404)
    def page_not_found(e):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(500)
    def internal_server_error(e):
        return jsonify({"error": "Internal server error occurred"}), 500

    return app

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
