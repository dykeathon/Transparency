import os

import requests

# API_URL = "https://api-inference.huggingface.co/models/turing08/distilbert-base-uncased-finetuned-hate"
# API_URL= "https://api-i;;nference.huggingface.co/models/Hate-speech-CNERG/dehatebert-mono-english"
API_URL = "https://api-inference.huggingface.co/models/unitary/toxic-bert"
HUGGING_FACE_KEY = os.getenv(
    "HUGGING_FACE_KEY",
    "<KEY>"
)
HEADERS = {"Authorization": f"Bearer {HUGGING_FACE_KEY}"}


def classify_transphobia(text):
    response = requests.post(API_URL, headers=HEADERS, json={"inputs": text})
    if response.status_code != 200:
        raise Exception(f"Request failed: {response.status_code} - {response.text}")

    result = response.json()[0]
    return result
    # print(result)
    # return {
    #     "label": result[0]["label"],
    #     "score": result[0]["score"],
    #     "is_transphobic": result[0]["score"]>0.5,
    #     "is_offensive": max(score for item in result for score in [item["score"]]) > 0.7
    #
    # }
def is_text_offvensive(result):
    is_offensive = max(score for item in result for score in [item["score"]]) > 0.7
    return is_offensive

if __name__ == "__main__":
    texts_to_evaluate = [
        "Trans women aren't real women.",
        "Everyone deserves equal rights regardless of gender identity.",
        "You people are disgusting.",
        "I support the LGBTQ+ community wholeheartedly.",
        "They should be banned from public spaces.",
        "Why are pronouns such a big deal anyway?",
        "He is such a freak for dressing like that.",
        "Love is love, no matter what.",
        "That’s not normal behavior.",
        "We don’t want people like them in our school."
    ]
    for text in texts_to_evaluate:
        output = classify_transphobia(text)  # API call
        is_offensive = is_text_offvensive(output)
        print(f"[{'⚠️' if is_offensive else '✅'}] {text}")
