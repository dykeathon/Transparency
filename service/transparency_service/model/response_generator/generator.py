# main.py

import os
from openai import AzureOpenAI
from typing import List, Tuple
from transparency_service.model.response_generator.constants import PROMPT_ROLE
# from transparency_service.api.messages.generate_response_request import GenerateResponseRequest
# from transparency_service.api.messages.generated_response import GeneratedResponse

# Azure OpenAI Configuration
ENDPOINT = "https://gila.openai.azure.com/"
MODEL_NAME = "gpt-4o-mini"
DEPLOYMENT = "gpt-4o-mini"
API_VERSION = "2024-12-01-preview"
API_KEY = os.getenv("AZURE_OPENAI_API_KEY")  # Ensure to set this environment variable

# def generate_response_wrapper(request: GenerateResponseRequest) -> GeneratedResponse:
#     """
#     Takes a GenerateResponseRequest object and returns a GeneratedResponse object.
#     Handles internal API key and link setup.
#     """

#     # Internal configuration
#     api_key = "mock API key"  # Replace with a secure method of loading your key
#     reference_links: List[str] = [
#         "https://transwiki.co.il/",
#         "https://www.maayangender.com/"
#     ]

#     # Extract fields
#     params = {
#         "comment": request.hateful_content,
#         "tone": request.response_generation_parameters.tone.value,
#         "length": request.response_generation_parameters.length.value,
#         "include_links": request.response_generation_parameters.should_include_links,
#         "language": request.response_generation_parameters.content_language.value
#     }

#     # Generate content
#     content = generate_response(api_key=api_key, reference_links=reference_links, params_from_chrome_extension=params)

#     # Conditionally include links
#     links = reference_links if request.response_generation_parameters.should_include_links else []

#     return GeneratedResponse(content=content, links=links)


def generate_response(comment: str, tone: str, length: Tuple[int, int], include_links: bool, reference_links: list[str]) -> str:
    """
    Generate an Azure OpenAI-powered educational response to a comment.
    """

    # Build the prompt
    prompt = build_prompt(
        comment=comment,
        tone=tone,
        length=length,
        include_links=include_links,
        reference_links=reference_links
    )

    try:
        # Initialize Azure OpenAI client
        client = AzureOpenAI(
            api_version=API_VERSION,
            azure_endpoint=ENDPOINT,
            api_key=API_KEY,
        )

        # Call the chat completion endpoint
        response = client.chat.completions.create(
            model=DEPLOYMENT,
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant who provides respectful and informative responses to online comments about transgender topics."
                },
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            max_tokens=256,
            temperature=1.0,
            top_p=1.0
        )

        return response.choices[0].message.content

    except Exception as e:
        return f"Error generating response: {str(e)}"


def build_prompt(comment: str, tone: str, length: Tuple[int, int], include_links: bool, reference_links: list[str]) -> str:
    min_chars, max_chars = length
    sources_text = "\n".join(reference_links)

    link_instruction = (
        "Include links from the sources in your response for the reader to verify and extend their knowledge. Blend it in the text in a natural way."
        if include_links else
        "Do not include links in the response, use them only as background knowledge."
    )

    return (
        f"---\n"
        f"ROLE:\n"
        f"{PROMPT_ROLE}\n\n"

        f"---\n"
        f"CONTEXT:\n"
        f"A user commented: \"{comment}\"\n\n"

        f"---\n"
        f"INSTRUCTIONS:\n"
        f"Write a {tone} response that is educational and factually accurate about transgender people.\n"
        f"I should use the following trusted sources:\n{sources_text} when it is relevent.\n"
        f"Try to reflect the language, tone, or concerns of the user's comment, when appropriate, to sound relatable and human.\n"
        f"The response should be between {min_chars} and {max_chars} characters in length.\n"
        f"{link_instruction}\n"

        f"---\n"
        f"OUTPUT:\n"
    )


def main():
    # Sample test input
    comment = "I don't understand why people can't just stick to their biological gender."
    tone = "mocking"
    length: Tuple[int, int] = (150, 300)
    include_links = False
    reference_links = [
        "https://transwiki.co.il/",
        "https://www.maayangender.com/"
    ]

    # Call your function
    response = generate_response(
        comment=comment,
        tone=tone,
        length=length,
        include_links=include_links,
        reference_links=reference_links
    )

    print("Generated Response:\n")
    print(response)


if __name__ == "__main__":
    main()
