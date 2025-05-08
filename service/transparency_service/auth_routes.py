from fastapi import APIRouter, Request, HTTPException
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import os


CLIENT_ID = os.getenv("CLIENT_ID")
router = APIRouter()

@router.get("/api/verify")
async def secure_data(request: Request):
    auth_header = request.headers.get('authorization')
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")

    token = auth_header.split("Bearer ")[-1]

    try:
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), CLIENT_ID)
        user_email = idinfo['email']
        return {"message": f"valid user, {user_email}!"}
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token")
