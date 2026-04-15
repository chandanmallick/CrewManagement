from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from admin_logic.auth_utils import verify_password, create_access_token, get_current_user
from database.database_mongo import employee_collection, login_history_collection
from datetime import datetime, timedelta, timezone

IST = timezone(timedelta(hours=5, minutes=30))

def convert_to_ist(dt):
    if not dt:
        return None
    return dt.replace(tzinfo=timezone.utc).astimezone(IST)

router = APIRouter()


class LoginRequest(BaseModel):
    userId: str
    password: str


@router.post("/login")
def login(data: LoginRequest, request: Request):

    user = employee_collection.find_one({
        "userId": data.userId
    })

    if not user:
        # 🔥 Log failed login
        login_history_collection.insert_one({
            "employeeId": data.userId,
            "status": "Failed",
            "loginTime": datetime.utcnow(),
            "createdOn": datetime.utcnow()
        })

        raise HTTPException(status_code=401, detail="Invalid user")

    stored_password = user.get("password")

    # bcrypt
    if stored_password and stored_password.startswith("$2"):
        if not verify_password(data.password, stored_password):

            login_history_collection.insert_one({
                "employeeId": data.userId,
                "name": user.get("name"),
                "status": "Failed",
                "loginTime": datetime.utcnow(),
                "createdOn": datetime.utcnow()
            })

            raise HTTPException(status_code=401, detail="Invalid password")

    else:
        if data.password != stored_password:

            login_history_collection.insert_one({
                "employeeId": data.userId,
                "name": user.get("name"),
                "status": "Failed",
                "loginTime": datetime.utcnow(),
                "createdOn": datetime.utcnow()
            })

            raise HTTPException(status_code=401, detail="Invalid password")

    token = create_access_token({
        "employeeId": user["userId"],
        "role": user.get("role", "user")
    })

    # ✅ SUCCESS LOGIN LOG
    login_history_collection.insert_one({
        "employeeId": user.get("userId"),   # ✅ FIXED
        "name": user.get("name"),
        "role": user.get("role"),

        "loginTime": datetime.utcnow(),
        "logoutTime": None,

        "ip": request.client.host,
        "userAgent": request.headers.get("user-agent"),

        "status": "Success",
        "createdOn": datetime.utcnow()
    })

    return {
        "access_token": token,
        "employeeId": user["userId"],
        "role": user.get("role", "user"),
        "name": user.get("name")
    }


################## Login History #########################

@router.get("/login-history/{employeeId}")
def get_login_history(employeeId: str):

    data = list(login_history_collection.find(
        {"employeeId": employeeId}
    ).sort("loginTime", -1).limit(10))

    for d in data:
        d["_id"] = str(d["_id"])

        d["loginTime"] = convert_to_ist(d.get("loginTime"))
        d["logoutTime"] = convert_to_ist(d.get("logoutTime"))

    return data



@router.get("/admin/login-history")
def admin_login_history(
    startDate: str = None,
    endDate: str = None
):

    query = {}

    if startDate and endDate:

        start = datetime.fromisoformat(startDate).replace(tzinfo=IST).astimezone(timezone.utc)
        end = (datetime.fromisoformat(endDate) + timedelta(days=1)).replace(tzinfo=IST).astimezone(timezone.utc)

        query["loginTime"] = {
            "$gte": start,
            "$lt": end   # 🔥 use $lt instead of $lte
        }

    data = list(login_history_collection.find(query)
                .sort("loginTime", -1)
                .limit(200))

    for d in data:
        d["_id"] = str(d["_id"])

        d["loginTime"] = convert_to_ist(d.get("loginTime"))
        d["logoutTime"] = convert_to_ist(d.get("logoutTime"))

    return data


@router.post("/logout")
def logout(user=Depends(get_current_user)):

    # 🔥 STEP 1: find latest active session
    latest = login_history_collection.find_one(
        {
            "employeeId": user["employeeId"],
            "logoutTime": None
        },
        sort=[("loginTime", -1)]
    )

    if not latest:
        return {"message": "No active session found"}

    # 🔥 STEP 2: update that specific record
    login_history_collection.update_one(
        {"_id": latest["_id"]},
        {
            "$set": {
                "logoutTime": datetime.utcnow()
            }
        }
    )

    return {"message": "Logged out successfully"}



############## Login Summary

@router.get("/admin/login-summary")
def login_summary(startDate: str = None, endDate: str = None):

    query = {}

    if startDate and endDate:
        start = datetime.fromisoformat(startDate).replace(tzinfo=IST).astimezone(timezone.utc)
        end = (datetime.fromisoformat(endDate) + timedelta(days=1)).replace(tzinfo=IST).astimezone(timezone.utc)

        query["loginTime"] = {
            "$gte": start,
            "$lt": end
        }

    data = list(login_history_collection.find(query))

    total = len(data)
    success = len([d for d in data if d.get("status") == "Success"])
    failed = len([d for d in data if d.get("status") == "Failed"])
    active = len([d for d in data if not d.get("logoutTime")])

    return {
        "total": total,
        "success": success,
        "failed": failed,
        "active": active
    }