from transparency_service.api.messages.generate_response_request import *
from transparency_service.api.messages.generated_response import *

class GenerateResponseCommand:
    def __init__(self):
        pass

    def execute(self, request: GenerateResponseRequest) -> GeneratedResponse:
        print(f"Generating response for request: {request}")

        return GeneratedResponse(
            content="very reasonable and convincing mocked response",
            links=[
                "https://transwiki.co.il/",
                "https://www.maayangender.com/",
            ]
        )