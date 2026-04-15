from database.database_mongo import employee_collection


def create_employee_logic(data):

    employee_data = {
        "name": data.get("name"),
        "nameHindi": data.get("nameHindi"),
        "designation": data.get("designation"),
        "designationHindi": data.get("designationHindi"),
        "userId": data.get("userId"),
        "password": data.get("password"),
        "phone": data.get("phone"),
        "gmail": data.get("gmail"),
        "dutyType": data.get("dutyType"),
        "category": data.get("category"),

        # 🔥 NEW STRUCTURE (Hierarchy)
        "vertical": data.get("vertical"),
        "department": data.get("department"),
        "reportingOfficerId": data.get("reportingOfficerId"),
        "intermediaryReportingId": data.get("intermediaryReportingId"),
        "hodId": data.get("hodId"),

        # 🔥 Metadata
        "createdAt": data.get("createdAt"),
        "updatedAt": data.get("updatedAt")
    }

    result = employee_collection.insert_one(employee_data)
    return str(result.inserted_id)


def get_all_employees_logic():
    return list(employee_collection.find())