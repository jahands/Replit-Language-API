import json

from fastapi import FastAPI
from fastapi.responses import RedirectResponse

from lib import get_languages_cached

app = FastAPI()
# FastAPI docs: https://fastapi.tiangolo.com/


@app.get("/")
async def read_root():
    return RedirectResponse("https://Replit-Language-API.jahands.repl.co/docs", 307)


@app.get("/api/languages")
async def get_languages():
    return {
        "api_version": 1,
        "languages": json.loads(get_languages_cached())
    }
