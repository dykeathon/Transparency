# main.py

import google.generativeai as genai
from prompt_utils import validate_params, build_prompt

def generate_response(api_key: str, reference_links: list[str], params_from_chrome_extension: dict) -> str:
    """
    Generate a Gemini-powered educational response to a comment.
    """

    # Validate inputs
    error = validate_params(params_from_chrome_extension)
    if error:
        return error

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")

    prompt = build_prompt(
        comment=params_from_chrome_extension["comment"],
        tone=params_from_chrome_extension["tone"],
        length=params_from_chrome_extension["length"],
        include_links=params_from_chrome_extension["include_links"],
        reference_links=reference_links
    )

    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Error generating response: {str(e)}"

# Example usage
if __name__ == "__main__":
    api_key = "AIzaSyCYus2jrYRqN2zg4tLxhDutlRoLOiuxiv8"
    reference_links = [
        "https://transwiki.co.il/",
        "https://www.maayangender.com/"
    ]
    params_from_chrome_extension = {
        "comment": "Transgender ppl are stupid.",
        "tone": "angry",
        "length": "long",
        "include_links": True
    }

    result = generate_response(api_key, reference_links, params_from_chrome_extension)
    print(result)
