import datetime
from flask import Blueprint, request, jsonify, g
from bson import ObjectId
from backend.middleware import token_required
from backend.documents.services import DocumentService
from backend.documents.utils import allowed_file
from backend.services.gemini_service import GeminiService
from backend.models.database import db_client

documents_bp = Blueprint("documents", __name__)

@documents_bp.route("/upload", methods=["POST"])
@token_required
def upload_document():
    if "file" not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
    
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type. Supported types: PDF, PNG, JPG, JPEG"}), 400

    try:
        response, status_code = DocumentService.process_and_save(g.user_id, file, file.filename)
        return jsonify(response), status_code
    except Exception as e:
        return jsonify({"error": f"Upload failed: {str(e)}"}), 500

@documents_bp.route("/", methods=["GET"])
@token_required
def list_documents():
    response, status_code = DocumentService.get_user_documents(g.user_id)
    return jsonify(response), status_code

@documents_bp.route("/<document_id>", methods=["GET"])
@token_required
def get_document(document_id):
    if not ObjectId.is_valid(document_id):
        return jsonify({"error": "Invalid document ID format"}), 400
    response, status_code = DocumentService.get_document_details(g.user_id, document_id)
    return jsonify(response), status_code

@documents_bp.route("/<document_id>", methods=["DELETE"])
@token_required
def delete_document(document_id):
    if not ObjectId.is_valid(document_id):
        return jsonify({"error": "Invalid document ID format"}), 400
    response, status_code = DocumentService.delete_document(g.user_id, document_id)
    return jsonify(response), status_code

@documents_bp.route("/<document_id>/chat", methods=["POST"])
@token_required
def chat_document(document_id):
    if not ObjectId.is_valid(document_id):
        return jsonify({"error": "Invalid document ID format"}), 400
        
    data = request.get_json() or {}
    question = data.get("question")
    if not question:
        return jsonify({"error": "Question is required"}), 400

    db = db_client.connect()
    
    # Verify ownership
    doc = db.documents.find_one({
        "_id": ObjectId(document_id),
        "user_id": ObjectId(g.user_id)
    })
    if not doc:
        return jsonify({"error": "Document not found"}), 404

    # Fetch last chat logs for context
    msg_cursor = db.chat_messages.find({"document_id": ObjectId(document_id)}).sort("timestamp", 1)
    chat_history = []
    for msg in msg_cursor:
        chat_history.append({
            "role": msg["role"],
            "message": msg["message"]
        })

    # Call Gemini Chat Service
    answer = GeminiService.chat_with_document(chat_history, question, doc)

    # Save messages to database
    db.chat_messages.insert_many([
        {
            "document_id": ObjectId(document_id),
            "user_id": ObjectId(g.user_id),
            "role": "user",
            "message": question,
            "timestamp": datetime.datetime.utcnow()
        },
        {
            "document_id": ObjectId(document_id),
            "user_id": ObjectId(g.user_id),
            "role": "assistant",
            "message": answer,
            "timestamp": datetime.datetime.utcnow()
        }
    ])

    return jsonify({
        "question": question,
        "answer": answer
    }), 200

@documents_bp.route("/<document_id>/chat", methods=["GET"])
@token_required
def get_chat_history(document_id):
    if not ObjectId.is_valid(document_id):
        return jsonify({"error": "Invalid document ID"}), 400
        
    db = db_client.connect()
    
    # Confirm document exists
    doc = db.documents.find_one({"_id": ObjectId(document_id), "user_id": ObjectId(g.user_id)})
    if not doc:
        return jsonify({"error": "Document not found"}), 404

    msg_cursor = db.chat_messages.find({"document_id": ObjectId(document_id)}).sort("timestamp", 1)
    history = []
    for msg in msg_cursor:
        history.append({
            "role": msg["role"],
            "message": msg["message"],
            "timestamp": msg["timestamp"].isoformat() if msg.get("timestamp") else None
        })

    return jsonify({"history": history}), 200
