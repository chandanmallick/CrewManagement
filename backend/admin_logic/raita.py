from pymongo import MongoClient

# For local MongoDB
MONGO_URI = "mongodb://localhost:27017"

client = MongoClient(MONGO_URI)

db = client["crew_management"]

# employee_list = list(db.employees.find({}))

# for employee in employee_list:
#     if (employee["userId"].endswith("\xa0")):
#         print(employee)
#         newuserid  = employee["userId"].replace("\xa0", "")
#         result = db.employees.update_one(employee, {"$set": {"userId": newuserid}})
#         print(result)

employee_list = list(db.employee_daily_collection.find({}))
print(employee_list)

for employee in employee_list:
    if (employee["employeeId"].endswith("\xa0")):
        print(employee)
        newuserid  = employee["employeeId"].replace("\xa0", "")
        result = db.employees.update_one(employee, {"$set": {"employeeId": newuserid}})
        print(result)


# db = client["crew_management"]   # change if your DB name is different
# employee_collection = db["employees"]  # change if your collection name differs

# result = employee_collection.update_many(
#     {"role": {"$exists": False}},   # only documents without role
#     {"$set": {"role": "user"}}
# )

# print("Documents updated:", result.modified_count)


# employee_daily_collection = db["employee_daily_collection"]
# for doc in employee_daily_collection.find():

#     if doc.get("departmentIC"):
#         emp_id = doc["departmentIC"]["employeeId"].strip()

#         employee_daily_collection.update_one(
#             {"_id": doc["_id"]},
#             {"$set": {"departmentIC.employeeId": emp_id}}
#         )