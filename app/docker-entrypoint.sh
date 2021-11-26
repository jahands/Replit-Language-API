#!/bin/sh
exec gunicorn main:app --workers 2 --bind 0.0.0.0:$PORT -k uvicorn.workers.UvicornWorker
