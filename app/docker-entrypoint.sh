#!/bin/sh
exec uvicorn main:app --port $PORT --host 0.0.0.0 --workers $(nproc)
