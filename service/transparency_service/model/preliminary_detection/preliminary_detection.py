import os
import google.generativeai as genai
import requests

# API_URL = "https://api-inference.huggingface.co/models/turing08/distilbert-base-uncased-finetuned-hate"
# API_URL= "https://api-i;;nference.huggingface.co/models/Hate-speech-CNERG/dehatebert-mono-english"
API_URL_ENGLISH = "https://api-inference.huggingface.co/models/unitary/toxic-bert"
API_URL_HEBREW = "https://api-inference.huggingface.co/models/avichr/heBERT_sentiment_analysis"
# API_URL_HEBREW = "https://api-inference.huggingface.co/models/SicariusSicariiStuff/Zion_Alpha_Instruction_Tuned_SLERP"
# API_URL_HEBREW = "https://api-inference.huggingface.co/models/onlplab/alephbert-base"
# API_URL_HEBREW = API_URL_ENGLISH
# HUGGING_FACE_KEY = os.getenv(
#     "HUGGING_FACE_KEY",
#     "<KEY>"
# )
HEADERS = {"Authorization": f"Bearer {os.getenv('HUGGING_FACE_KEY')}"}

def is_text_offensive(text: str, language: str) -> bool:
    """
    Check if the text is offensive using the appropriate model based on the language.
    """
    if language == "english":
        result = is_text_offensive_english(text)
        return max(score for item in result for score in [item["score"]]) > 0.7
    elif language == "hebrew":
        result = is_text_offensive_hebrew(text)
        return max(score for item in result for score in [item["score"]]) > 0.7
    return None


def classify_transphobia_english(text):
    response = requests.post(API_URL_ENGLISH, headers=HEADERS, json={"inputs": text})
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
def is_text_offensive_english(text: str):
    result = classify_transphobia_english(text)  # API call
    return max(score for item in result for score in [item["score"]]) > 0.7

def classify_transphobia_hebrew(text):
    response = requests.post(API_URL_HEBREW, headers=HEADERS, json={"inputs": text})
    if response.status_code != 200:
        raise Exception(f"Request failed: {response.status_code} - {response.text}")

    result = response.json()[0]
    return result


def build_prompt():
    return """
    You are an AI model specializing in content moderation and social bias detection, with a specific focus on identifying hatred or hostility directed toward transgender individuals in written text.
    
    Your task is to analyze the given input text and determine whether it contains hatred, transphobia, or malicious stereotyping against transgender people. This includes:
    
    Explicit hate speech (e.g., insults, threats, slurs)
    
    Dehumanizing or derogatory language
    
    Harmful stereotypes or conspiratorial claims
    
    Incitement of fear, disgust, or violence
    
    Subtle but harmful exclusionary or invalidating narratives (e.g., denial of trans identities)
    
    Your Response Should Include:
    Binary classification:
    
    "label": "True"
    
    or "label": "False"    
    
    """


def is_text_offensive_hebrew(text: str, api_key: str=None) -> str:
    """
    Use Gemini API to analyze whether the Hebrew input text is hateful toward transgender individuals.
    """
    api_key = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")

    prompt = build_prompt() + f"\n\nInput Text:\n{text.strip()}\n\nYour Answer:"

    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return f"Error generating response: {str(e)}"


if __name__ == "__main__":
    # texts_to_evaluate = [
    #     "Trans women aren't real women.",
    #     "Everyone deserves equal rights regardless of gender identity.",
    #     "You people are disgusting.",
    #     "I support the LGBTQ+ community wholeheartedly.",
    #     "They should be banned from public spaces.",
    #     "Why are pronouns such a big deal anyway?",
    #     "He is such a freak for dressing like that.",
    #     "Love is love, no matter what.",
    #     "That’s not normal behavior.",
    #     "We don’t want people like them in our school."
    # ]
    texts_to_evaluate = [
        "הם לא אמיתיים.",
        "כולם צריכים להיות שווים.",
        "אתם אנשים מגעילים.",
        "אני תומך בקהילה הלהט",
    ]
    api_key = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

    for text in texts_to_evaluate:
        result = is_text_offensive_hebrew(text, api_key)
        print(f"\nText: {text}\nResult: {result}\n{'-' * 50}")