from database.database_mongo import sequence_collection

def serialize_sequence(doc):
    return {
        "id": str(doc["_id"]),
        "name": doc.get("name"),
        "pattern": doc.get("pattern")
    }

def create_sequence(data: dict):
    sequence_collection.insert_one({
        "name": data.get("name"),
        "pattern": data.get("pattern")
    })
    return {"message": "Sequence created"}

def get_sequences_logic():
    return list(sequence_collection.find())
