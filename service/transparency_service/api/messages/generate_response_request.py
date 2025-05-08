from enum import Enum

from pydantic import BaseModel

"""
Defines the request model for generating a response to hateful content.

Json example:
{
   "hateful_content":"some very not nice comment I saw on the internet",
   "response_generation_parameters":{
      "length":"one_liner",
      "tone":"assertive",
      "should_include_links":false
   }
}
"""

class ResponseLengthEnum(Enum):
    ONE_LINER = "one_liner" # up to 75 characters
    SHORT = "short" # 75 to 150 characters
    MEDIUM = "medium" # 150 to 300 characters
    LONG = "long" # 300 to 1000 characters

class ResponseToneEnum(Enum):
    EMPATHETIC = "empathetic" # Humanizes the topic and invites reflection
    SUPPORTIVE = "supportive" # Affirms and protects those who may feel targeted
    INFORMATIONAL = "informational" # Shares facts without getting defensive or confrontational
    ASSERTIVE = "assertive" # Makes it clear that harmful speech isn’t acceptable, while maintaining professionalism
    DE_ESCALATING = "de_escalating" # Redirects the conversation toward understanding rather than conflict

class ResponseGenerationParameters(BaseModel):
    length: ResponseLengthEnum
    tone: ResponseToneEnum
    should_include_links: bool

class GenerateResponseRequest(BaseModel):
    hateful_content: str
    response_generation_parameters: ResponseGenerationParameters
