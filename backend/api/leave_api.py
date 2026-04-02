from fastapi import APIRouter, HTTPException, Query, Depends
from datetime import datetime, timedelta
from bson import ObjectId

from database.database_mongo import (
    leave_request_collection,
    employee_daily_collection,
    employee_collection,
    DutyLeave_collection,
    system_settings_collection,
    compensatory_off_collection,
    deleted_leave_collection
)

from admin_logic.auth_utils import get_current_user, require_admin
from admin_logic.notification_service import notify_all
from typing import Optional
import uuid

router = APIRouter()


def calculate_expiry_check(expiry_date: str, leave_date: str) -> bool:
    """
    Returns True if comp-off is still valid for given leave date
    """

    try:
        expiry = datetime.strptime(expiry_date, "%Y-%m-%d")
        leave = datetime.strptime(leave_date, "%Y-%m-%d")
    except Exception:
        return False

    return expiry >= leave


def is_group_leave_rule_enabled():

    setting = system_settings_collection.find_one(
        {"settingName": "singleLeavePerGroupPerDay"}
    )

    if not setting:
        return False

    return setting.get("enabled", False)

def calculate_expiry(earned_date_str):
    from datetime import datetime

    earned = datetime.strptime(earned_date_str, "%Y-%m-%d")

    next_year = earned.year + 1

    return f"{next_year}-03-31"

###################################################
# Get my Role
###################################################

@router.get("/my-role")
def get_my_role(user = Depends(get_current_user)):

    emp_id = user["employeeId"].strip()
    today = datetime.now().strftime("%Y-%m-%d")

    # Check if user is SIC
    sic_record = employee_daily_collection.find_one({
        "date": today,
        "employeeId": {"$regex": f"^{emp_id}\\s*$"},
        "isSIC": True
    })

    is_sic = sic_record is not None

    # Check if user is Department IC
    dept_ic_record = employee_daily_collection.find_one({
        "date": today,
        "$expr": {
            "$eq": [
                {"$trim": {"input": "$departmentIC.employeeId"}},
                emp_id
            ]
        }
    })

    is_dept_ic = dept_ic_record is not None

    return {
        "employeeId": emp_id,
        "isSIC": is_sic,
        "isDeptIC": is_dept_ic
    }


# =========================================================
# EMPLOYEE LIST
# =========================================================

@router.get("/employees")
def get_leave_employees(user=Depends(get_current_user)):

    role = user.get("role")
    emp_id = user.get("employeeId")

    if role == "admin":

        employees = list(employee_collection.find({}, {"_id": 0}))

    else:

        emp = employee_collection.find_one(
            {"userId": emp_id},
            {"_id": 0}
        )

        if not emp:
            raise HTTPException(404, "Employee not found")

        employees = [emp]

    for e in employees:
        e["employeeId"] = e.get("userId")

    return employees


# =========================================================
# LEAVE TYPES
# =========================================================

@router.get("/leave-types")
def get_leave_types(user=Depends(get_current_user)):

    data = DutyLeave_collection.find({
        "dutyLeaveType_cat": "leaveType",
        "status": "Active"
    })

    result = []

    for d in data:
        print(d)

        # 🔥 TRY ALL POSSIBLE FIELD NAMES
        name = (
            d.get("value")
        )

        if not name:
            continue  # skip bad records

        result.append({
            "label": name,
            "value": name
        })

    return result


# =========================================================
# CHECK DUTY BEFORE APPLY
# =========================================================

@router.get("/duty")
def get_employee_duty(employeeId: str, date: str):

    record = employee_daily_collection.find_one({
        "employeeId": employeeId,
        "date": date
    })

    if not record:
        raise HTTPException(404, "Duty not found")

    return {
        "assignedDuty": record.get("assignedDuty"),
        "groupName": record.get("groupName"),
        "isHoliday": record.get("isHoliday"),
        "isSIC": record.get("isSIC", False)
    }


# =========================================================
# APPLY LEAVE
# =========================================================

@router.post("/apply")
def apply_leave(data: dict, user=Depends(get_current_user)):

    leave_group_id = str(uuid.uuid4())

    role = user["role"]
    logged_employee = user["employeeId"].strip()

    employee_id_request = data.get("employeeId")

    # =========================
    # ROLE HANDLING
    # =========================
    if role == "user":
        employee_id = logged_employee

    elif role == "admin":

        if not employee_id_request:
            raise HTTPException(400, "employeeId required for admin")

        employee_id = employee_id_request.strip()

    else:
        raise HTTPException(403, "Invalid role")

    emp = employee_collection.find_one({"userId": employee_id})

    if not emp:
        raise HTTPException(404, "Employee not found")

    is_sic = emp.get("isSIC", False)

    leave_type = data.get("leaveType")
    reason = data.get("reason")

    leave_date = data.get("date")
    start_date = data.get("startDate")
    end_date = data.get("endDate")

    
    if leave_date and (start_date or end_date):
        raise HTTPException(400, "Provide either date OR range, not both")

    comp_off_id = data.get("compOffId")  # 🔥 NEW

    if not leave_type:
        raise HTTPException(400, "Leave type required")

    # =========================
    # DATE HANDLING
    # =========================
    dates = []


    # 🔥 NEW SUPPORT (PUT THIS FIRST)
    if data.get("dates"):
        dates = data.get("dates")

    elif leave_date:
        dates = [leave_date]

    elif start_date and end_date:

        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")

        current = start

        while current <= end:
            dates.append(current.strftime("%Y-%m-%d"))
            current += timedelta(days=1)

    else:
        raise HTTPException(400, "Provide date OR startDate/endDate")

    inserted_ids = []
    errors = []
    success = []

    for date_str in dates:
        try:
            # validation + insert
            success.append(date_str)
        except Exception as e:
            errors.append({"date": date_str, "error": str(e)})

    # =========================
    # LOOP EACH DATE
    # =========================
    for date_str in dates:

        duty = employee_daily_collection.find_one({
            "employeeId": employee_id,
            "date": date_str
        })

        if not duty:
            raise HTTPException(404, f"Duty not found for {date_str}")

        group_name = duty["groupName"]

        # =========================
        # DUPLICATE CHECK
        # =========================
        duplicate = leave_request_collection.find_one({
            "employeeId": employee_id,
            "date": date_str
        })

        if duplicate:
            raise HTTPException(400, f"Leave already applied for {date_str}")

        # =========================
        # GROUP RULE
        # =========================
        if is_group_leave_rule_enabled():

            existing_leave = leave_request_collection.find_one({
                "groupName": group_name,
                "date": date_str,
                "employeeId": {"$ne": employee_id},
                "finalStatus": {
                    "$in": ["Applied", "Forwarded by SIC", "Approved"]
                }
            })

        if existing_leave:
            raise HTTPException(
                400,
                f"Another member from group already has leave on {date_str}"
            )

        # =========================
        # 🔥 COMP-OFF VALIDATION
        # =========================
        if leave_type == "C-OFF":

            if not comp_off_id:
                raise HTTPException(400, "Comp-off selection required")

            comp = compensatory_off_collection.find_one({
                "_id": ObjectId(comp_off_id),
                "employeeId": employee_id
            })

            if not comp:
                raise HTTPException(404, "Invalid comp-off")

            if comp.get("status") != "Available":
                raise HTTPException(400, "Comp-off already used")

            if not calculate_expiry_check(comp.get("expiryDate"), date_str):
                raise HTTPException(400, "Comp-off expired")

        # =========================
        # INSERT LEAVE
        # =========================
        leave_id = leave_request_collection.insert_one({

            "employeeId": employee_id,
            "name": duty["name"],
            "designation": duty["designation"],
            "groupName": group_name,
            "isSIC": is_sic,
            "date": date_str,
            "leaveType": leave_type,
            "reason": reason,
            "leaveGroupId": leave_group_id,

            "sicApprovalStatus": "Pending",
            "deptApprovalStatus": "Pending",
            "finalStatus": "Applied",

            "replacementRequired": False,
            "replacement": None,

            "compOffId": comp_off_id if leave_type == "C-OFF" else None,

            "createdOn": datetime.utcnow()
        }).inserted_id

        inserted_ids.append(str(leave_id))

        # =========================
        # UPDATE DAILY
        # =========================
        employee_daily_collection.update_one(
            {
                "employeeId": employee_id,
                "date": date_str
            },
            {
                "$set": {
                    "leaveRequestId": str(leave_id),
                    "leaveType": leave_type,
                    "leaveStatus": "Applied"
                }
            }
        )

        # =========================
        # 🔥 MARK COMP-OFF USED
        # =========================
        if leave_type == "C-OFF":

            compensatory_off_collection.update_one(
                {"_id": ObjectId(comp_off_id)},
                {
                    "$set": {
                        "status": "Reserved",
                        "linkedLeaveId": str(leave_id),
                        "usedDate": date_str,
                        "linkedLeaveId": str(leave_id)
                    }
                }
            )

    # 🔥 SEND SINGLE MAIL AFTER LOOP

    # get SIC
    sic_record = employee_daily_collection.find_one({
        "date": dates[0],
        "groupName": group_name,
        "isSIC": True
    })

    sic_emp = employee_collection.find_one({
        "userId": sic_record["employeeId"]
    }) if sic_record else None

    sic_email = sic_emp.get("gmail") if sic_emp else None

    notify_all(
        email_list=[sic_email] if sic_email else [],
        employee_ids=[sic_record["employeeId"]] if sic_record else [],
        subject="Leave Application (Multiple Days)",
        message=f"""
    {emp.get("name")} applied leave

    From: {dates[0]}
    To: {dates[-1]}
    Total Days: {len(dates)}

    Group: {group_name}
    """
    )
    return {
        "message": "Leave applied successfully",
        "leaveRecords": inserted_ids
    }

# =========================================================
# GET ALL LEAVES
# =========================================================

@router.get("/all")
def get_all_leave(fromDate: str = Query(...), toDate: str = Query(...)):

    records = list(leave_request_collection.find({

        "date": {
            "$gte": fromDate,
            "$lte": toDate
        }

    }).sort("createdOn", -1))

    result = []

    for r in records:
        result.append({
            "id": str(r["_id"]),
            "name": r.get("name"),
            "date": r.get("date"),
            "leaveType": r.get("leaveType"),
            "finalStatus": r.get("finalStatus")
        })

    return result


# =========================================================
# SIC FORWARD
# =========================================================

@router.put("/sic-forward-bulk")
def sic_forward_bulk(data: dict, user=Depends(get_current_user)):

    leaves = data.get("leaves", [])

    if not leaves:
        raise HTTPException(400, "No leave selected")

    emp_id = user["employeeId"].strip()

    updated_count = 0

    for item in leaves:

        leave_id = item.get("id")
        replacement_required = item.get("replacementRequired", False)

        leave = leave_request_collection.find_one({"_id": ObjectId(leave_id)})

        if not leave:
            continue

        if leave.get("sicApprovalStatus") == "Forwarded":
            continue

        duty = employee_daily_collection.find_one({
            "employeeId": {"$regex": f"^{emp_id}\\s*$"},
            "date": leave["date"]
        })

        if not duty or not duty.get("isSIC"):
            continue

        leave_request_collection.update_one(
            {"_id": leave["_id"]},
            {
                "$set": {
                    "sicApprovalStatus": "Forwarded",
                    "replacementRequired": replacement_required,
                    "updatedOn": datetime.utcnow()
                }
            }
        )

        employee_daily_collection.update_one(
            {
                "employeeId": leave["employeeId"],
                "date": leave["date"]
            },
            {
                "$set": {
                    "leaveStatus": "Forwarded by SIC"
                }
            }
        )

        updated_count += 1

    return {"message": f"{updated_count} leave(s) forwarded"}

# =========================================================
# APPROVE LEAVE
# =========================================================

@router.put("/approve-bulk")
def approve_leave_bulk(data: dict, user=Depends(get_current_user)):

    leave_ids = data.get("leaveIds", [])

    if not leave_ids:
        raise HTTPException(400, "No leave selected")

    emp_id = user["employeeId"].strip()
    today = datetime.now().strftime("%Y-%m-%d")

    # ✅ DIC VALIDATION (UNCHANGED)
    dept_ic_record = employee_daily_collection.find_one({
        "date": today,
        "$expr": {
            "$eq": [
                {"$trim": {"input": "$departmentIC.employeeId"}},
                emp_id
            ]
        }
    })

    if not dept_ic_record:
        raise HTTPException(403, "Only Department IC can approve")

    updated_count = 0

    for lid in leave_ids:

        leave = leave_request_collection.find_one({"_id": ObjectId(lid)})

        if not leave:
            continue

        # ❌ skip already approved
        if leave.get("deptApprovalStatus") == "Approved":
            continue

        # 🔥 HANDLE SIC CASE (IMPORTANT)
        if leave.get("isSIC"):

            employee_daily_collection.update_one(
                {
                    "employeeId": leave["employeeId"],
                    "date": leave["date"]
                },
                {
                    "$unset": {
                        "sic": "",
                        "isActingSIC": ""
                    }
                }
            )

        # 🔥 HANDLE C-OFF REDEMPTION (IMPORTANT)
        if leave.get("leaveType") == "C-OFF" and leave.get("compOffId"):

            compensatory_off_collection.update_one(
                {"_id": ObjectId(leave["compOffId"])},
                {
                    "$set": {
                        "status": "Used",
                        "usedDate": leave.get("date")
                    }
                }
            )

        # ✅ APPROVE THIS SINGLE DATE ONLY
        leave_request_collection.update_one(
            {"_id": leave["_id"]},
            {
                "$set": {
                    "deptApprovalStatus": "Approved",
                    "finalStatus": "Approved",
                    "updatedOn": datetime.utcnow()
                }
            }
        )

        employee_daily_collection.update_one(
            {
                "employeeId": leave["employeeId"],
                "date": leave["date"]
            },
            {
                "$set": {"leaveStatus": "Approved"}
            }
        )

        updated_count += 1

    if updated_count == 0:
        raise HTTPException(400, "No valid leaves approved")

    # 🔥 SINGLE NOTIFICATION (OPTIONAL IMPROVEMENT)
    notify_all(
        email_list=[],
        employee_ids=[],
        subject="Leave Approved (Partial)",
        message=f"{updated_count} leave(s) approved"
    )

    return {"message": f"{updated_count} leave(s) approved"}


#######################################
# Get all list
#######################################

@router.get("/list")
def get_leave_list(user = Depends(get_current_user)):

    today = datetime.now().strftime("%Y-%m-%d")

    role = user.get("role")
    emp_id = user.get("employeeId")

    # Admin → see all upcoming leave
    if role == "admin":

        query = {
            "date": {"$gte": today}
        }

    else:

        duty = employee_daily_collection.find_one({
            "employeeId": emp_id,
            "date": today
        })

        group = duty.get("groupName") if duty else None

        query = {
            "groupName": group,
            "date": {"$gte": today}
        }

    records = list(
        leave_request_collection.find(query).sort("createdOn", -1)
    )

    result = []

    for r in records:

        others = list(employee_daily_collection.find({
            "date": r.get("date"),
            "groupName": r.get("groupName"),
            "leaveStatus": {
                "$in": ["Applied", "Forwarded by SIC", "Approved"]
            },
            "employeeId": {"$ne": r.get("employeeId")}
        }))

        result.append({
            "id": str(r["_id"]),
            "name": r.get("name"),
            "groupName": r.get("groupName"),
            "isSIC": r.get("isSIC"),
            "date": r.get("date"),
            "leaveType": r.get("leaveType"),
            "sicApprovalStatus": r.get("sicApprovalStatus"),
            "deptApprovalStatus": r.get("deptApprovalStatus"),
            "finalStatus": r.get("finalStatus"),
            "replacementRequired": r.get("replacementRequired", False),
            "createdOn": r.get("createdOn"),
            # 🔥 NEW FIELD
            "othersOnLeave": [
                {
                    "employeeId": o.get("employeeId"),
                    "name": o.get("name")
                }
                for o in others
            ]
        })

    return result

########################################
#Get duty details
########################################

@router.get("/duty-detailed")
def get_duty_detailed(
    employeeId: str,
    startDate: str,
    endDate: str
):

    employeeId = employeeId.strip()

    start = datetime.strptime(startDate, "%Y-%m-%d")
    end = datetime.strptime(endDate, "%Y-%m-%d")

    result = []

    current = start

    while current <= end:

        date_str = current.strftime("%Y-%m-%d")

        rec = employee_daily_collection.find_one({
            "employeeId": employeeId,
            "date": date_str
        })

        if rec:

            others = list(employee_daily_collection.find({
                "date": date_str,
                "groupName": rec["groupName"],
                "leaveStatus": {
                    "$in": ["Applied", "Forwarded by SIC", "Approved"]
                },
                "employeeId": {"$ne": employeeId}
            }))

            result.append({
                "date": date_str,
                "assignedDuty": rec.get("assignedDuty"),
                "groupName": rec.get("groupName"),
                "isHoliday": rec.get("isHoliday"),
                "othersOnLeave": [
                    {
                        "employeeId": o["employeeId"],
                        "name": o.get("name"),
                        "leaveType": o.get("leaveType"),
                        "leaveStatus": o.get("leaveStatus")
                    }
                    for o in others
                ]
            })

        current += timedelta(days=1)

    return result

################# C-OFF History 

@router.get("/comp-off/history")
def comp_off_history(
    employeeId: Optional[str] = Query(None),
    status: Optional[str] = Query(None)
):

    query = {}

    if employeeId:
        query["employeeId"] = employeeId

    if status:
        query["status"] = status  # Available / Used

    records = compensatory_off_collection.find(query).sort("earnedDate", -1)

    result = []

    for r in records:

        result.append({
            "id": str(r["_id"]),
            "employeeId": r.get("employeeId"),
            "earnedDate": r.get("earnedDate"),
            "expiryDate": r.get("expiryDate"),
            "status": r.get("status"),
            "usedDate": r.get("usedDate"),
            "source": r.get("reference", {}).get("type"),
            "linkedLeaveId": r.get("linkedLeaveId")
        })

    return result

###############################################
################## Delete the leave trace #######################
##############################################################
@router.delete("/super-revert/{leave_id}")
def super_revert_leave(leave_id: str, user=Depends(require_admin)):

    leave = leave_request_collection.find_one({
        "_id": ObjectId(leave_id)
    })

    if not leave:
        raise HTTPException(404, "Leave not found")

    leave_date = leave.get("date")
    emp_id = leave.get("employeeId")
    group_name = leave.get("groupName")

    # =========================================
    # 1️⃣ ARCHIVE (HIDDEN LOG)
    # =========================================
    archive_doc = {
        **leave,
        "deletedOn": datetime.utcnow(),
        "deletedBy": user.get("employeeId"),
        "action": "SUPER_REVERT"
    }

    deleted_leave_collection.insert_one(archive_doc)

    # =========================================
    # 2️⃣ RESTORE LEAVE EMPLOYEE
    # =========================================
    employee_daily_collection.update_one(
        {
            "employeeId": emp_id,
            "date": leave_date
        },
        {
            "$unset": {
                "leaveStatus": "",
                "leaveType": "",
                "leaveRequestId": "",
                "replacementAssigned": ""
            }
        }
    )

    # =========================================
    # 3️⃣ REMOVE REPLACEMENT
    # =========================================
    replacement = leave.get("replacement")

    if replacement:
        replacement_id = replacement.get("employeeId")

        employee_daily_collection.update_one(
            {
                "employeeId": replacement_id,
                "date": leave_date
            },
            {
                "$unset": {
                    "replacementDuty": "",
                    "replacementFor": "",
                    "replacementMode": "",
                    "halfDuty": ""
                }
            }
        )

    # =========================================
    # 4️⃣ REMOVE TEMP SIC
    # =========================================
    employee_daily_collection.update_many(
        {
            "date": leave_date,
            "groupName": group_name
        },
        {
            "$unset": {
                "sic": "",
                "isActingSIC": ""
            }
        }
    )

    # =========================================
    # 5️⃣ RESTORE PERMANENT SIC
    # =========================================
    original_sic = employee_daily_collection.find_one({
        "date": leave_date,
        "groupName": group_name,
        "isSIC": True
    })

    if original_sic:
        employee_daily_collection.update_many(
            {
                "date": leave_date,
                "groupName": group_name
            },
            {
                "$set": {
                    "sic": {
                        "employeeId": original_sic["employeeId"],
                        "name": original_sic["name"],
                        "designation": original_sic["designation"],
                        "type": "permanent"
                    }
                }
            }
        )

    # 🔥 RESTORE COMP-OFF
    if leave.get("compOffId"):

        compensatory_off_collection.update_one(
            {"_id": ObjectId(leave["compOffId"])},
            {
                "$set": {"status": "Available"},
                "$unset": {
                    "linkedLeaveId": "",
                    "usedDate": ""
                }
            }
        )


    # =========================================
    # 7️⃣ HARD DELETE LEAVE
    # =========================================
    leave_request_collection.delete_one({
        "_id": ObjectId(leave_id)
    })

    return {"message": "Super revert completed successfully"}

###################### Fetch C OFF Data ##################

@router.get("/comp-off/available")
def get_available_comp_off(user=Depends(get_current_user)):

    emp_id = user["employeeId"]

    records = compensatory_off_collection.find({
        "employeeId": emp_id,
        "status": "Available"
    }).sort("earnedDate", 1)

    result = []

    for r in records:
        result.append({
            "id": str(r["_id"]),
            "earnedDate": r.get("earnedDate"),
            "expiryDate": r.get("expiryDate"),
            "reason": r.get("reason")
        })

    return result


@router.put("/withdraw/{leave_id}")
def withdraw_leave(leave_id: str, user=Depends(get_current_user)):

    leave = leave_request_collection.find_one({
        "_id": ObjectId(leave_id)
    })

    if not leave:
        raise HTTPException(404, "Leave not found")

    emp_id = user["employeeId"].strip()

    # 🔒 Only owner can withdraw
    if leave["employeeId"] != emp_id:
        raise HTTPException(403, "Not allowed")

    # ❌ Already approved cannot withdraw
    if leave.get("finalStatus") == "Approved":
        raise HTTPException(400, "Cannot withdraw approved leave")

    # ✅ UPDATE LEAVE
    leave_request_collection.update_one(
        {"_id": ObjectId(leave_id)},
        {
            "$set": {
                "finalStatus": "Withdrawn",
                "updatedOn": datetime.utcnow()
            }
        }
    )

    # ✅ UPDATE DAILY
    employee_daily_collection.update_one(
        {
            "employeeId": leave["employeeId"],
            "date": leave["date"]
        },
        {
            "$unset": {
                "leaveStatus": "",
                "leaveType": "",
                "leaveRequestId": ""
            }
        }
    )

    return {"message": "Leave withdrawn successfully"}