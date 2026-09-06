from fastapi import FastAPI

from app.routers import process, speak

app = FastAPI(title="AgriVision LLM Service")

app.include_router(process.router)
app.include_router(speak.router)


@app.get("/")
def home():
    return {"message": "AgriVision LLM service is running"}
