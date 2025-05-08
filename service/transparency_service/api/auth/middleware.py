from fastapi import Request
from starlette.responses import JSONResponse
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

async def auth_middleware(request: Request, call_next):
    try:
        auth_header = request.headers.get("authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return JSONResponse(status_code=401, content={"error": "Unauthorized"})

        token = auth_header.split("Bearer ")[-1]

        try:
            idinfo = id_token.verify_oauth2_token(token, google_requests.Request())
            request.state.user_email = idinfo["email"]
        except ValueError:
            return JSONResponse(status_code=401, content={"error": "Invalid token"})

        return await call_next(request)

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": "Internal Server Error", "detail": str(e)})