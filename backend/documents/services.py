import os
import datetime
from bson import ObjectId
from backend.models.database import db_client
from backend.documents.utils import get_safe_filepath, extract_text_from_pdf
from backend.services.gemini_service import GeminiService

class DocumentService:
    @staticmethod
    def process_and_save(user_id, file, filename):
        db = db_client.connect()
        
        # Validate Upload Quotas
        user = db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            return {"error": "User profile not found"}, 404
            
        doc_quota = user.get("doc_quota", 5)
        current_count = db.documents.count_documents({"user_id": ObjectId(user_id)})
        if current_count >= doc_quota:
            return {"error": "Document upload quota exceeded. Upgrade to professional plan."}, 403

        # Save file to disk
        file_path = get_safe_filepath(user_id, filename)
        file.save(file_path)

        # Get file extension
        file_ext = filename.rsplit(".", 1)[1].lower()
        
        # Initial text extraction (best effort for local preview/caching)
        raw_text = ""
        if file_ext == "pdf":
            raw_text = extract_text_from_pdf(file_path)

        # Save record to database in STAGING state
        doc_record = {
            "user_id": ObjectId(user_id),
            "filename": filename,
            "file_path": file_path,
            "file_type": file_ext,
            "raw_text": raw_text,
            "status": "processing",
            "classification": "Unknown",
            "analysis_results": None,
            "created_at": datetime.datetime.utcnow()
        }
        
        doc_id = db.documents.insert_one(doc_record).inserted_id

        # Run AI analysis (Runs Gemini API to get executive_summary, risks, etc.)
        try:
            analysis = GeminiService.analyze_document(file_path, file_ext)
            
            # Update record with analysis findings
            db.documents.update_one(
                {"_id": doc_id},
                {
                    "$set": {
                        "status": "completed",
                        "classification": analysis.get("classification", "Contract"),
                        "analysis_results": {
                            "executive_summary": analysis.get("executive_summary", ""),
                            "risk_score": analysis.get("risk_score", 0),
                            "risks": analysis.get("risks", []),
                            "liabilities": analysis.get("liabilities", []),
                            "deadlines": analysis.get("deadlines", []),
                            "action_items": analysis.get("action_items", [])
                        }
                    }
                }
            )
            # Log activities
            db.activity_logs.insert_one({
                "user_id": ObjectId(user_id),
                "action": "UPLOAD",
                "details": f"Uploaded and audited document: {filename}",
                "timestamp": datetime.datetime.utcnow()
            })
        except Exception as e:
            print(f"AI Analysis failed for doc {doc_id}: {e}")
            db.documents.update_one(
                {"_id": doc_id},
                {
                    "$set": {
                        "status": "failed",
                        "error_message": str(e)
                    }
                }
            )
            # Log failure
            db.activity_logs.insert_one({
                "user_id": ObjectId(user_id),
                "action": "UPLOAD_FAILED",
                "details": f"Analysis failed for {filename}: {str(e)}",
                "timestamp": datetime.datetime.utcnow()
            })
            return {"error": f"Document saved but AI analysis failed: {str(e)}", "document_id": str(doc_id)}, 500

        return {
            "message": "Document processed and analyzed successfully",
            "document_id": str(doc_id)
        }, 201

    @staticmethod
    def get_user_documents(user_id):
        db = db_client.connect()
        # Find all documents, exclude raw_text to save bandwidth
        docs = list(db.documents.find(
            {"user_id": ObjectId(user_id)},
            {"raw_text": 0, "file_path": 0}
        ).sort("created_at", -1))
        
        # Serialize ObjectIds to strings
        for doc in docs:
            doc["id"] = str(doc["_id"])
            del doc["_id"]
            doc["user_id"] = str(doc["user_id"])
            if doc.get("created_at"):
                doc["created_at"] = doc["created_at"].isoformat()
        
        return {"documents": docs}, 200

    @staticmethod
    def get_document_details(user_id, document_id):
        db = db_client.connect()
        doc = db.documents.find_one({
            "_id": ObjectId(document_id),
            "user_id": ObjectId(user_id)
        })
        if not doc:
            return {"error": "Document not found"}, 404

        doc["id"] = str(doc["_id"])
        del doc["_id"]
        doc["user_id"] = str(doc["user_id"])
        if doc.get("created_at"):
            doc["created_at"] = doc["created_at"].isoformat()

        return {"document": doc}, 200

    @staticmethod
    def delete_document(user_id, document_id):
        db = db_client.connect()
        doc = db.documents.find_one({
            "_id": ObjectId(document_id),
            "user_id": ObjectId(user_id)
        })
        if not doc:
            return {"error": "Document not found"}, 404

        # Remove file from disk
        if os.path.exists(doc["file_path"]):
            try:
                os.remove(doc["file_path"])
            except Exception as e:
                print(f"Error removing file {doc['file_path']}: {e}")

        # Delete database entries
        db.documents.delete_one({"_id": ObjectId(document_id)})
        db.chat_messages.delete_many({"document_id": ObjectId(document_id)})

        # Log deletion activity
        db.activity_logs.insert_one({
            "user_id": ObjectId(user_id),
            "action": "DELETE",
            "details": f"Removed document: {doc['filename']}",
            "timestamp": datetime.datetime.utcnow()
        })

        return {"message": "Document deleted successfully"}, 200
