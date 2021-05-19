import json

from fastapi import FastAPI, HTTPException
from fastapi.responses import RedirectResponse

from lib import get_languages_cached
from dblog import dblog
from logzero import logger

app = FastAPI()
# FastAPI docs: https://fastapi.tiangolo.com/


@app.get("/")
async def read_root():
    return RedirectResponse("https://Replit-Language-API.jahands.repl.co/docs",
                            307)


@app.get("/api/languages")
async def get_languages():
    try:
        languages = get_languages_cached()
    except Exception as e:
        logger.exception(e)
        dblog(e)
        raise HTTPException(status_code=500, detail="internal server error")
    return {"api_version": 1, "languages": json.loads(languages)}
