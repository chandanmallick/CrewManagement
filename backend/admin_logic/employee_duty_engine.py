from datetime import datetime
from database.database_mongo import (
    roster_group_collection,
    employee_duty_collection
)


def build_employee_dataset(roster_id, roster_data, is_final):

    # Only build dataset if final roster
    if not is_final:
        return

    for group in roster_data:

        group_name = group["groupName"]
        group_duties = group["data"]

        # Get active group members
        group_doc = roster_group_collection.find_one({
            "groupName": group_name,
            "isActive": True
        })

        if not group_doc:
            continue

        members = group_doc.get("members", [])
        sic = group_doc.get("shiftInCharge")

        records = []

        for date, duty in group_duties.items():

            # Insert for normal members
            for member in members:

                records.append({
                    "employeeId": member.get("id"),
                    "employeeName": member.get("name"),
                    "designation": member.get("designation"),

                    "date": date,
                    "groupName": group_name,

                    # 🔹 original planned duty
                    "rosterDuty": duty,

                    # 🔹 editable duty
                    "assignedDuty": duty,

                    "isSIC": False,

                    "rosterId": str(roster_id),
                    "isFinal": True,

                    # Leave / exchange flags
                    "isLeave": False,
                    "leaveType": None,
                    "isExchange": False,
                    "exchangeWithEmployeeId": None,
                    "isExtraDuty": False,
                    "isManualOverride": False,

                    # Future fields
                    "extra1": None,
                    "extra2": None,
                    "extra3": None,
                    "extra4": None,
                    "extra5": None,

                    "createdOn": datetime.utcnow(),
                    "updatedOn": None
                })

            # Insert for SIC
            if sic:
                records.append({
                    "employeeId": sic.get("id"),
                    "employeeName": sic.get("name"),
                    "designation": sic.get("designation"),

                    "date": date,
                    "groupName": group_name,

                    "rosterDuty": duty,
                    "assignedDuty": duty,

                    "isSIC": True,

                    "rosterId": str(roster_id),
                    "isFinal": True,

                    "isLeave": False,
                    "leaveType": None,
                    "isExchange": False,
                    "exchangeWithEmployeeId": None,
                    "isExtraDuty": False,
                    "isManualOverride": False,

                    "extra1": None,
                    "extra2": None,
                    "extra3": None,
                    "extra4": None,
                    "extra5": None,

                    "createdOn": datetime.utcnow(),
                    "updatedOn": None
                })

        if records:
            employee_duty_collection.insert_many(records)