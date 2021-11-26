import json
import os

from fastapi import FastAPI, HTTPException
from fastapi.responses import RedirectResponse, JSONResponse

from lib import get_languages_cached
from logzero import logger


app = FastAPI()
# FastAPI docs: https://fastapi.tiangolo.com/


@app.get("/")
async def read_root():
    headers = {'Cache-Control': 'max-age=3600', 'Cloudflare-CDN-Cache-Control': 'max-age=86400'}
    return RedirectResponse("https://replit-language-api.uuid.rocks/docs", 307, headers=headers)

@app.get("/ping")
async def get_ping():
    # Store for 5 seconds to prevent ddos
    headers = {'Cache-Control': 'max-age=5', 'Cloudflare-CDN-Cache-Control': 'max-age=5'}
    return JSONResponse({"message": "pong"}, headers=headers)


@app.get("/api/languages")
async def get_languages():
    try:
        languages = get_languages_cached()
    except Exception as e:
        logger.exception(e)
        raise HTTPException(status_code=500, detail="internal server error")
    content = {
        "api_version":
        1,
        "languages":
        json.loads(languages)
    }
    headers = {'Cache-Control': 'max-age=3600', 'Cloudflare-CDN-Cache-Control': 'max-age=86400'}
    return JSONResponse(content=content, headers=headers)


@app.get("/api/languages/keys")
async def get_languages_keys():
    try:
        languages = json.loads(get_languages_cached())
        language_keys = []
        for lang in languages:
            language_keys.append(lang)

    except Exception as e:
        logger.exception(e)
        raise HTTPException(status_code=500, detail="internal server error")
    content = {"api_version": 1, "language_keys": language_keys}
    headers = {'Cache-Control': 'max-age=3600', 'Cloudflare-CDN-Cache-Control': 'max-age=86400'}
    return JSONResponse(content=content, headers=headers)
