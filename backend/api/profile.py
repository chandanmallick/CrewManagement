from fastapi import APIRouter, UploadFile, File, Form, Query
from database.database_mongo import (
    roster_master_collection,
    employee_daily_collection,
    training_nomination_history_collection,
    employee_collection,
    compensatory_off_collection
)
import shutil, os
from datetime import datetime

router = APIRouter()

UPLOAD_FOLDER = "uploads/profile"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# -----------------------------
# 1. Profile (static info only)
# -----------------------------
@router.get("/profile/{employeeId}")
def get_profile(employeeId: str):

    employee = employee_collection.find_one({"userId": employeeId})

    if not employee:
        return {"error": "Employee not found"}

    return {
        "employeeId": employee.get("employeeId"),
        "name": employee.get("name"),
        "designation": employee.get("designation"),
        "phone": employee.get("phone"),
        "nameHindi": employee.get("nameHindi"),
        "profilePhoto": employee.get("profilePhoto")
    }


# ---------------------------------
# 2. Monthly Duty Stats (dropdown)
# ---------------------------------
@router.get("/stats/duty")
def duty_stats(employeeId: str, year: int, month: int):

    pipeline = [

        {
            "$addFields": {
                "dateObj": {
                    "$dateFromString": {
                        "dateString": "$date"
                    }
                }
            }
        },

        {
            "$match": {
                "employeeId": employeeId,
                "$expr": {
                    "$and": [
                        {"$eq": [{"$year": "$dateObj"}, year]},
                        {"$eq": [{"$month": "$dateObj"}, month]}
                    ]
                }
            }
        },

        {
            "$group": {
                "_id": "$assignedDuty",
                "count": {"$sum": 1}
            }
        }

    ]

    stats = list(employee_daily_collection.aggregate(pipeline))

    return {
        "employeeId": employeeId,
        "year": year,
        "month": month,
        "stats": stats
    }


# ---------------------------------
# 3. Yearly Leave Stats
# ---------------------------------
@router.get("/stats/leave")
def leave_stats(employeeId: str, year: int):

    pipeline = [

        {
            "$addFields": {
                "dateObj": {
                    "$dateFromString": {
                        "dateString": "$date"
                    }
                }
            }
        },

        {
            "$match": {
                "employeeId": employeeId,
                "leaveStatus": "Approved",
                "$expr": {
                    "$eq": [
                        {"$year": "$dateObj"},
                        year
                    ]
                }
            }
        },

        {
            "$group": {
                "_id": "$leaveType",
                "count": {"$sum": 1}
            }
        }

    ]

    stats = list(employee_daily_collection.aggregate(pipeline))

    return {
        "employeeId": employeeId,
        "year": year,
        "stats": stats
    }


# ---------------------------------
# 4. Training Stats by Financial Year
# ---------------------------------
@router.get("/stats/training")
def training_stats(
    employeeId: str,
    financialYear: str = Query(...)
):

    stats = list(
        training_nomination_history_collection.aggregate([
            {
                "$match": {
                    "employeeId": employeeId,
                    "status": "Approved",
                    "financialYear": financialYear
                }
            },
            {
                "$group": {
                    "_id": "$trainingName",
                    "count": {"$sum": 1}
                }
            }
        ])
    )

    return {"financialYear": financialYear, "stats": stats}


# ---------------------------------
# 5. Profile Update
# ---------------------------------
@router.post("/profile/update")
async def update_profile(
    employeeId: str = Form(...),
    nameHindi: str = Form(""),
    phone: str = Form(""),
    photo: UploadFile = File(None)
):

    update_data = {
        "nameHindi": nameHindi,
        "phone": phone
    }

    if photo:

        filename = f"{employeeId}.jpg"
        filepath = os.path.join(UPLOAD_FOLDER, filename)

        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)

        update_data["profilePhoto"] = f"/uploads/profile/{filename}"

    employee_collection.update_one(
        {"userId": employeeId},
        {"$set": update_data}
    )

    employee = employee_collection.find_one({"userId": employeeId})
    print("PHOTO RECEIVED:", photo)

    return {
        "employeeId": employee.get("employeeId"),
        "name": employee.get("name"),
        "designation": employee.get("designation"),
        "phone": employee.get("phone"),
        "nameHindi": employee.get("nameHindi"),
        "profilePhoto": employee.get("profilePhoto")
    }



###########################################
#### C-OFF Collection #############
###########################################

@router.get("/stats/coff")
def get_coff_stats(employeeId: str):

    records = list(compensatory_off_collection.find({
        "employeeId": employeeId
    }))

    total = len(records)
    used = len([r for r in records if r.get("status") == "Used"])
    available = len([r for r in records if r.get("status") == "Available"])

    return {
        "summary": {
            "total": total,
            "used": used,
            "available": available
        },
        "details": [
            {
                "earnedDate": r.get("earnedDate"),
                "expiryDate": r.get("expiryDate"),
                "usedDate": r.get("usedDate"),
                "status": r.get("status"),
                "reason": r.get("reason")
            }
            for r in records
        ]
    }