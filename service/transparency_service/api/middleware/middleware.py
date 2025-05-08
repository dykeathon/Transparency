import os
from fastapi import Request, HTTPException
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

CLIENT_ID = os.getenv("CLIENT_ID")

from fastapi import Request, HTTPException
from starlette.responses import JSONResponse
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
import os

CLIENT_ID = os.getenv("CLIENT_ID")

async def auth_middleware(request: Request, call_next):
    try:
        auth_header = request.headers.get('authorization')
        if not auth_header or not auth_header.startswith("Bearer "):
            return JSONResponse(status_code=401, content={"error": "Unauthorized"})

        token = auth_header.split("Bearer ")[-1]

        try:
            idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), CLIENT_ID)
            request.state.user_email = idinfo['email']
        except ValueError:
            return JSONResponse(status_code=401, content={"error": "Invalid token"})

        return await call_next(request)

    except Exception as e:
        # Return a generic 500 error response with detail
        return JSONResponse(status_code=500, content={"error": "Internal Server Error", "detail": str(e)})