#!/bin/sh

exec uvicorn --reload main:app --port $PORT --host 0.0.0.0 --workers $(nproc)
