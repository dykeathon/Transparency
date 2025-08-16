# transparency_service/app_server.py
from fastapi import FastAPI, HTTPException
from transparency_service.api.commands.generate_response_command import GenerateResponseCommand
from transparency_service.api.messages.generate_response_request import GenerateResponseRequest
from transparency_service.api.messages.generated_response import GeneratedResponse
from transparency_service.api.auth.middleware import auth_middleware

transparency_app = FastAPI()
transparency_app.middleware("http")(auth_middleware)

@transparency_app.post("/transparency/generate_response")
async def generate_response(payload: GenerateResponseRequest, response_model=GeneratedResponse):

    try:
        response: GeneratedResponse = GenerateResponseCommand(request=payload).execute()

    except ValueError as value_error:
        raise HTTPException(status_code=400, detail=str(value_error))

    return response
