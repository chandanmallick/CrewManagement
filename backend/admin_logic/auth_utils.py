from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer

SECRET_KEY = "crew_management_secret"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 8

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


def hash_password(password: str):
    return pwd_context.hash(password)


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict):

    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return encoded_jwt


def get_current_user(credentials = Depends(security)):

    token = credentials.credentials

    try:

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        return payload

    except Exception as e:
        print(e)

        raise HTTPException(status_code=401, detail="Invalid authentication token")


def require_admin(user = Depends(get_current_user)):

    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    return user


def check_replacement_access(user):

    if user.get("role") == "admin":
        return True

    if user.get("isDeptIC"):
        return True

    raise HTTPException(
        status_code=403,
        detail="You are not authorized to access replacement module"
    )