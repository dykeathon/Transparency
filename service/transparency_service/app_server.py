# transparency_service/app_server.py

from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from transparency_service.api.commands.generate_response_command import GenerateResponseCommand
from transparency_service.api.messages.generate_response_request import GenerateResponseRequest
from transparency_service.api.messages.generated_response import GeneratedResponse
from transparency_service.api.middleware.middleware import auth_middleware

load_dotenv()

# Add root route
@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.generate_response_command = GenerateResponseCommand()

    print("Lifespan startup: initialized parameters.")

    yield

    print("Lifespan shutdown: cleaning up.")

transparency_app = FastAPI(lifespan=lifespan)
transparency_app.middleware("http")(auth_middleware)


@transparency_app.get("/")
async def root():
    return {"message": "Hello World"}


@transparency_app.post("/transparency/generate_response")
async def generate_response(payload: GenerateResponseRequest, response_model=GeneratedResponse):
    return transparency_app.state.generate_response_command.execute(request=payload)
