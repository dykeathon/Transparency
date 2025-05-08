# transparency_service/app_server.py

from fastapi import FastAPI
from transparency_service.auth_routes import router as auth_router
from dotenv import load_dotenv

load_dotenv()

transparency_app = FastAPI()

# Add root route
@transparency_app.get("/")
async def root():
    return {"message": "Hello World"}

# Include /api/verify route
transparency_app.include_router(auth_router)
