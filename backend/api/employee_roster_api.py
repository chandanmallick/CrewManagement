from fastapi import APIRouter
from datetime import datetime
from bson import ObjectId

from database.database_mongo import (
    employee_duty_collection,
    roster_master_collection,
    holiday_master_collection
)

router = APIRouter()


# =========================================================
# CREATE EMPLOYEE DAILY DUTY DATA (When roster is final)
# =========================================================
@router.post("/create-from-roster/{roster_id}")
def create_employee_duty(roster_id: str):

    roster = roster_master_collection.find_one(
        {"_id": ObjectId(roster_id)}
    )

    if not roster:
        return {"error": "Roster not found"}

    # Delete existing entries for safety
    employee_duty_collection.delete_many({
        "rosterId": roster_id
    })

    holiday_dates = set(
            h["date"] for h in holiday_master_collection.find({}, {"date": 1}))

    records = []

    for group in roster["data"]:

        group_name = group["groupName"]

        for date, duty in group["data"].items():


            for member in group.get("members", []):

                records.append({
                    "employeeId": member["id"],
                    "employeeName": member["name"],
                    "designation": member["designation"],
                    "date": date,

                    "groupName": group_name,
                    "dutyCode": duty,

                    "isSIC": False,

                    "rosterId": roster_id,
                    "isFinal": True,

                    "isLeave": False,
                    "leaveType": None,

                    "isExchange": False,
                    "exchangeWithEmployeeId": None,

                    "isExtraDuty": False,
                    "isManualOverride": False,

                    "isHoliday": "Y" if date in holiday_dates else "N",
                    "compensatoryOffEligible": "Yes" if date in holiday_dates else "No",

                    "extra1": None,
                    "extra2": None,
                    "extra3": None,
                    "extra4": None,
                    "extra5": None,

                    "createdOn": datetime.utcnow(),
                    "updatedOn": datetime.utcnow()
                })

    if records:
        employee_duty_collection.insert_many(records)

    return {"message": "Employee daily duty created"}