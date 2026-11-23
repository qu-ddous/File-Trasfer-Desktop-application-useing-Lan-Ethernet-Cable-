import struct
import json
import os
import hashlib
from typing import Dict, Any, Tuple

# Length-prefix header: 4 bytes big endian unsigned int (up to 4GB)
# Format: '!I'
HEADER_FORMAT = "!I"
HEADER_SIZE = 4

MAGIC_PACKET = b"LS" # 2 bytes
MSG_CONTROL = 0x01   # JSON control message
MSG_CHUNK = 0x02     # Binary file chunk
MSG_ACK = 0x03       # Acknowledgment

def encode_message(data: Dict[str, Any]) -> bytes:
    """Encodes a JSON control message with a 4-byte big-endian length prefix."""
    payload = json.dumps(data).encode("utf-8")
    header = struct.pack(HEADER_FORMAT, len(payload))
    return header + payload

async def read_exact(reader, n: int) -> bytes:
    """Reads exactly n bytes from an asyncio StreamReader."""
    data = bytearray()
    while len(data) < n:
        chunk = await reader.read(n - len(data))
        if not chunk:
            raise ConnectionResetError("Connection closed unexpectedly while reading.")
        data.extend(chunk)
    return bytes(data)

async def read_message(reader) -> Dict[str, Any]:
    """Reads a length-prefixed JSON message from an asyncio StreamReader."""
    header = await read_exact(reader, HEADER_SIZE)
    msg_len = struct.unpack(HEADER_FORMAT, header)[0]
    payload = await read_exact(reader, msg_len)
    return json.loads(payload.decode("utf-8"))

def sanitize_relative_path(path_str: str) -> str:
    """
    Prevents path traversal attacks (e.g. '../', '/etc/passwd', 'C:\\Windows').
    Returns a safe normalized relative path.
    """
    # Replace backslashes with forward slashes
    clean = path_str.replace("\\", "/").strip()
    # Strip any leading slashes or Windows drive specifiers
    while clean.startswith("/") or (len(clean) >= 2 and clean[1] == ":"):
        if len(clean) >= 2 and clean[1] == ":":
            clean = clean[2:].lstrip("/")
        else:
            clean = clean.lstrip("/")
    
    parts = []
    for part in clean.split("/"):
        if part in ("", "."):
            continue
        if part == "..":
            # Disallow traversal upwards
            continue
        # Remove dangerous illegal characters for Windows filenames
        safe_part = "".join(c for c in part if c not in '<>:"/\\|?*')
        parts.append(safe_part)
        
    return "/".join(parts) if parts else "unnamed_item"

def calculate_sha256(filepath: str) -> str:
    """Computes SHA-256 hash of a local file in streaming blocks."""
    sha = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(1024 * 512):
            sha.update(chunk)
    return sha.hexdigest()
