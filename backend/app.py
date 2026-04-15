from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from api.admin_api import router as admin_router
from api.roster_api import router as roster_router
from api.leave_api import router as leave_router
from api.training_holiday_api import router as training_router
from api.auth import router as auth_router
from api.profile import router as profile_router

from api.replacement import router as replacement_router
from api.training_assignment import router as training_ass_router
from api.notification_api import router as notification_router
from api.dashboard import dashboard_router


from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles



app = FastAPI()

# app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ---------- ROUTERS ----------

app.include_router(profile_router, prefix="/profile")
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(admin_router, prefix="/admin", tags=["Admin"])
app.include_router(roster_router, prefix="/roster", tags=["Roster"])
app.include_router(leave_router, prefix="/leave", tags=["Leave"])
app.include_router(training_router, prefix="/Training_holiday", tags=["Training & Holiday"])
app.include_router(replacement_router, prefix="/replacement", tags=["Replacement"])
app.include_router(training_ass_router, prefix="/training-assign", tags=["Training Assignment"])
app.include_router(notification_router, prefix="/notifications", tags=["Notifications"])
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(dashboard_router)

# ---------- CORS ----------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000",
        "http://10.3.230.60:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- TEST ROUTE ----------
@app.get("/test")
def test_route():
    return {"status": "Backend is running successfully"}