import smtplib
import requests
from email.mime.text import MIMEText
from datetime import datetime

from database.database_mongo import duty_notification_collection

EMAIL = "erldccroomcrew@gmail.com"
PASSWORD = "yfwj mqbg geiz vltv"

TEAMS_WEBHOOK_URL = "YOUR_TEAMS_WEBHOOK_URL"  # 🔥 replace


# ============================================
# EMAIL
# ============================================

def send_email(to_list, subject, body):

    try:
        msg = MIMEText(body)
        msg["Subject"] = subject
        msg["From"] = EMAIL
        msg["To"] = ", ".join(to_list)

        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(EMAIL, PASSWORD)

        server.sendmail(EMAIL, to_list, msg.as_string())
        server.quit()

    except Exception as e:
        print("MAIL ERROR:", str(e))


# ============================================
# TEAMS
# ============================================

def send_teams(message):

    try:
        payload = {
            "text": message
        }
        requests.post(TEAMS_WEBHOOK_URL, json=payload)

    except Exception as e:
        print("TEAMS ERROR:", str(e))


# ============================================
# IN-APP NOTIFICATION
# ============================================

def send_app_notification(employee_ids, title, message):

    now = datetime.utcnow()

    docs = []

    for emp_id in employee_ids:
        docs.append({
            "employeeId": emp_id,
            "title": title,
            "message": message,
            "status": "Unread",
            "createdAt": now
        })

    if docs:
        duty_notification_collection.insert_many(docs)


# ============================================
# MASTER FUNCTION
# ============================================

def notify_all(email_list=None, employee_ids=None, subject=None, message=None):

    if email_list:
        send_email(email_list, subject, message)

    if employee_ids:
        send_app_notification(employee_ids, subject, message)

    # Teams (always send summary)
    send_teams(f"{subject}\n\n{message}")