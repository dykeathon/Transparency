from transparency_service.api.messages.generate_response_request import *
from transparency_service.api.messages.generated_response import *

from transparency_service.model.preliminary_detection.preliminary_detection import is_text_offensive

class GenerateResponseCommand:
    def __init__(self, request: GenerateResponseRequest):
        self.request: GenerateResponseRequest = request

    def __verify_request_is_offensive(self):
        request_content: str = self.request.hateful_content
        print(f"Verifying request content is offensive: {request_content}")
        should_process_content: bool =  is_text_offensive(request_content)

        if not should_process_content:
            raise ValueError("Request content haven't passed preliminary validation, verify comment is offensive.")

    def execute(self) -> GeneratedResponse:
        print(f"Generating response for request: {self.request}")

        self.__verify_request_is_offensive()

        return GeneratedResponse(
            content="very reasonable and convincing mocked response",
            links=[
                "https://transwiki.co.il/",
                "https://www.maayangender.com/",
            ]
        )