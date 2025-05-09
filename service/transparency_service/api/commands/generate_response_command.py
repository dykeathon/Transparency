from importlib.resources import files

from transparency_service.api.messages.generate_response_request import *
from transparency_service.api.messages.generated_response import *

from transparency_service.model.preliminary_detection.preliminary_detection import is_text_offensive
from transparency_service.model.response_generator.generator import generate_response

class GenerateResponseCommand:

    def __init__(self, request: GenerateResponseRequest):
        self.__request: GenerateResponseRequest = request


    def __verify_request_is_offensive(self):
        request_content: str = self.__request.hateful_content
        content_language: str = self.__request.response_generation_parameters.content_language.value
        print(f"Verifying request content is offensive: {request_content}")
        should_process_content: bool =  is_text_offensive(request_content, content_language)

        if not should_process_content:
            raise ValueError("Request content haven't passed preliminary validation, verify comment is offensive.")


    def __get_reference_links(self) -> list[str]:
        try:
            reference_links_file_path = files("transparency_service.resources").joinpath("reference_links.txt")

            with reference_links_file_path.open("r") as reference_links_file:
                reference_links = [line.strip() for line in reference_links_file.readlines()]
                print(f"Loaded reference links: {reference_links}")
                return reference_links
        except FileNotFoundError:
            return []


    def __map_length_enum_to_range(self) -> tuple[int, int]:
        length_enum: ResponseLengthEnum = self.__request.response_generation_parameters.length
        if length_enum == ResponseLengthEnum.ONE_LINER:
            return 0, 75
        elif length_enum == ResponseLengthEnum.SHORT:
            return 75, 150
        elif length_enum == ResponseLengthEnum.MEDIUM:
            return 150, 300
        elif length_enum == ResponseLengthEnum.LONG:
            return 300, 1000
        else:
            raise ValueError(f"Invalid response length: {length_enum}")


    def __generate_response(self) -> str:
        print(f"Generating response for request: {self.__request}")

        reference_links: list[str] = self.__get_reference_links()
        length_range: tuple[int, int] = self.__map_length_enum_to_range()

        response: str =  generate_response(
            comment=self.__request.hateful_content,
            tone=self.__request.response_generation_parameters.tone.value,
            length=length_range,
            include_links=self.__request.response_generation_parameters.should_include_links,
            reference_links=reference_links,
        )

        print(f"Generated response: {response}")
        return response


    def execute(self) -> GeneratedResponse:
        print(f"Generating response for request: {self.__request}")

        self.__verify_request_is_offensive()

        generated_response: str = self.__generate_response()

        return GeneratedResponse(
            content=generated_response,
            links=[]
        )