from transparency_service.model.response_generator.constants import LENGTH_LIMITS, REQUIRED_KEYS, PROMPT_ROLE

def validate_params(params: dict):
    missing = REQUIRED_KEYS - set(params)
    if missing:
        return f"Missing required keys: {missing}"

    if params["length"] not in LENGTH_LIMITS:
        return f"Invalid length option: {params['length']}. Must be one of: {list(LENGTH_LIMITS.keys())}"

    return None

# def build_prompt(comment: str, tone: str, length: str, include_links: bool, reference_links: list[str]) -> str:
#     length_description = LENGTH_LIMITS[length]
#     link_instruction = (
#         "Include citations or links from the sources in your response."
#         if include_links else
#         "Do not include any links in your response; use the references only for background."
#     )
#     sources_text = "\n".join(reference_links)

#     return (
#         f"A user commented: \"{comment}\"\n\n"
#         f"Write an educational, factual, and {tone} response about transgender people.\n"
#         f"The response should be {length_description} in length.\n"
#         f"{link_instruction}\n"
#         f"Use the following sources for accuracy:\n{sources_text}"
#     )


def build_prompt(comment: str, tone: str, length: str, include_links: bool, reference_links: list[str]) -> str:
    length_description = LENGTH_LIMITS[length]
    sources_text = "\n".join(reference_links)

    link_instruction = (
        "Include links from the sources in your response for the reader to verify and extand its knowladge. Bland it in the text in a natural way."
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
        # f"2. Ground your facts and framing in the following trusted sources:\n{sources_text}\n"
        f"Try to reflect the language, tone, or concerns of the user's comment, when appropriate, to sound relatable and human.\n"
        f"The response should be {length_description} in length.\n"
        f"{link_instruction}\n"

        f"---\n"
        f"OUTPUT:\n"
    )

