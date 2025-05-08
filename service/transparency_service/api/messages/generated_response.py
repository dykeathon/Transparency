from pydantic import BaseModel

"""
Defines the response model for generating a response to hateful content.

Json example:
{
   "content":"very reasonable and convincing response to the hateful content",
   "links":[
      "https://transwiki.co.il/",
      "https://www.maayangender.com/"
   ]
}
"""

class GeneratedResponse(BaseModel):
    content: str
    links: list[str] = []
