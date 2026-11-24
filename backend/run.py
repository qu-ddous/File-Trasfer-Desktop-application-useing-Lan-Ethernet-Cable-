import uvicorn
import os
import sys

# Ensure backend root is on PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

import fastapi
import starlette
import pydantic
import psutil
import websockets
from app.main import app
from app.config import DEFAULT_API_PORT

if __name__ == "__main__":
    port = int(os.environ.get("LANSHARE_API_PORT", DEFAULT_API_PORT))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
