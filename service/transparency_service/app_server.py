# transparency_service/app_server.py

from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from transparency_service.api.commands.generate_response_command import GenerateResponseCommand
from transparency_service.api.messages.generate_response_request import GenerateResponseRequest
from transparency_service.api.messages.generated_response import GeneratedResponse
from transparency_service.auth_routes import router as auth_router

load_dotenv()

# Add root route
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Lifespan startup: initialized parameters.")

    yield

    print("Lifespan shutdown: cleaning up.")

transparency_app = FastAPI(lifespan=lifespan)

@transparency_app.get("/")
async def root():
    return {"message": "Hello World"}

# Include /api/verify route
transparency_app.include_router(auth_router)


@transparency_app.post("/transparency/generate_response")
async def generate_response(payload: GenerateResponseRequest, response_model=GeneratedResponse):

    try:
        response: GeneratedResponse = GenerateResponseCommand(request=payload).execute()

    except ValueError as value_error:
        raise HTTPException(status_code=400) from value_error

    return response
