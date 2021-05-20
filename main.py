import json

from fastapi import FastAPI, HTTPException
from fastapi.responses import RedirectResponse, JSONResponse

from lib import get_languages_cached
from dblog import dblog
from logzero import logger

app = FastAPI()
# FastAPI docs: https://fastapi.tiangolo.com/


@app.get("/")
async def read_root():
    return RedirectResponse("https://replit-language-api.uuid.rocks/docs", 307)


@app.get("/api/languages")
async def get_languages():
    try:
        languages = get_languages_cached()
    except Exception as e:
        logger.exception(e)
        dblog(e)
        raise HTTPException(status_code=500, detail="internal server error")
    content = {"api_version": 1, "languages": json.loads(languages)}
    headers = {'Cache-Control': 'public, max-age=86400'}
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
        dblog(e)
        raise HTTPException(status_code=500, detail="internal server error")
    content = {"api_version": 1, "language_keys": language_keys}
    headers = {'Cache-Control': 'public, max-age=86400'}
    return JSONResponse(content=content, headers=headers)
