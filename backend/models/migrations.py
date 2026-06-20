from backend.models.database import db_client

def run_migrations():
    print("Starting database migration sweep...")
    db = db_client.connect()
    
    # 1. Update users missing roles or quotas
    users_cursor = db.users.find({
        "$or": [
            {"role": {"$exists": False}},
            {"doc_quota": {"$exists": False}}
        ]
    })
    
    migrated_users = 0
    for user in users_cursor:
        updates = {}
        if "role" not in user:
            # Set first user to admin, others to user
            user_count = db.users.count_documents({})
            updates["role"] = "admin" if user_count <= 1 else "user"
        if "doc_quota" not in user:
            updates["doc_quota"] = 5
            
        if updates:
            db.users.update_one({"_id": user["_id"]}, {"$set": updates})
            migrated_users += 1

    print(f"Migration completed. Updated {migrated_users} user profiles.")

if __name__ == "__main__":
    run_migrations()
