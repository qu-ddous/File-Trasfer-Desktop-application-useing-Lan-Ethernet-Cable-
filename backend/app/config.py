import os
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional

APP_NAME = "LANShare"
DEFAULT_DISCOVERY_PORT = 52520
DEFAULT_TRANSFER_PORT = 52521
DEFAULT_API_PORT = 52522
DEFAULT_CHUNK_SIZE = 1024 * 512  # 512 KB chunks for high-speed LAN throughput
BUFFER_SIZE = 1024 * 1024        # 1 MB socket buffer

# Default storage location in User's Downloads/LANShare
DEFAULT_DOWNLOAD_DIR = str(Path.home() / "Downloads" / "LANShare")
DATA_DIR = str(Path.home() / f".{APP_NAME.lower()}")
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(DEFAULT_DOWNLOAD_DIR, exist_ok=True)
DB_PATH = str(Path(DATA_DIR) / "lanshare.db")

class AppSettings(BaseModel):
    device_name: str
    device_id: str
    download_path: str = DEFAULT_DOWNLOAD_DIR
    discovery_port: int = DEFAULT_DISCOVERY_PORT
    transfer_port: int = DEFAULT_TRANSFER_PORT
    auto_accept_trusted: bool = False
    max_concurrent_transfers: int = 3
    chunk_size: int = DEFAULT_CHUNK_SIZE
    rate_limit_mbps: int = 0  # 0 = unlimited
    theme: str = "light"
    api_token: str = ""
