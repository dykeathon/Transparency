from fastapi import FastAPI

transparency_app = FastAPI()


@transparency_app.get("/")
async def root():
    return {"message": "Hello World"}