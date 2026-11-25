import asyncio
import logging
import os
import sys
from typing import List, Dict, Any, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.responses import FileResponse, HTMLResponse

from app.config import (
    APP_NAME,
    DEFAULT_API_PORT,
    DEFAULT_DISCOVERY_PORT,
    DEFAULT_TRANSFER_PORT,
    AppSettings
)
from app.database import (
    init_db,
    load_settings,
    save_settings,
    get_devices,
    update_device_pairing,
    get_transfers_history,
    get_transfer_details,
    clear_history
)
from app.network import get_network_interfaces, get_best_lan_ip
from app.discovery import DiscoveryEngine
from app.transfer import TransferEngine

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("LANShareAPI")

import collections
import time

class RingLogHandler(logging.Handler):
    def __init__(self, capacity=1000):
        super().__init__()
        self.logs = collections.deque(maxlen=capacity)

    def emit(self, record):
        try:
            msg = self.format(record)
            entry = {
                "id": str(time.time_ns()),
                "time": time.strftime("%H:%M:%S", time.localtime(record.created)),
                "level": record.levelname,
                "logger": record.name,
                "message": msg
            }
            self.logs.append(entry)
            try:
                loop = asyncio.get_running_loop()
                if loop and loop.is_running():
                    loop.create_task(broadcast_ws_event({"event": "log", "data": entry}))
            except RuntimeError:
                pass
        except Exception:
            pass

ring_log_handler = RingLogHandler()
ring_log_handler.setFormatter(logging.Formatter("%(message)s"))
logging.getLogger().addHandler(ring_log_handler)

# Global instances
discovery_engine: Optional[DiscoveryEngine] = None
transfer_engine: Optional[TransferEngine] = None
connected_websockets: List[WebSocket] = []

async def broadcast_ws_event(event_dict: Dict[str, Any]):
    """Broadcasts real-time events to all connected UI clients."""
    disconnected = []
    for ws in connected_websockets:
        try:
            await ws.send_json(event_dict)
        except Exception:
            disconnected.append(ws)
    for ws in disconnected:
        if ws in connected_websockets:
            connected_websockets.remove(ws)

@asynccontextmanager
async def lifespan(app: FastAPI):
    global discovery_engine, transfer_engine
    init_db()
    settings = load_settings()

    logger.info(f"Initializing {APP_NAME} for device: {settings.device_name} ({settings.device_id})")

    # Start Transfer Engine
    transfer_engine = TransferEngine(
        device_id=settings.device_id,
        device_name=settings.device_name,
        port=settings.transfer_port,
        broadcast_event_cb=broadcast_ws_event
    )
    await transfer_engine.start()

    # Start Discovery Engine
    async def on_device_found(dev: Dict[str, Any]):
        await broadcast_ws_event({"event": "device_discovered", "data": dev})

    async def on_device_lost(dev_id: str):
        await broadcast_ws_event({"event": "device_lost", "data": {"device_id": dev_id}})

    discovery_engine = DiscoveryEngine(
        device_id=settings.device_id,
        device_name=settings.device_name,
        transfer_port=settings.transfer_port,
        discovery_port=settings.discovery_port,
        on_device_discovered=on_device_found,
        on_device_lost=on_device_lost
    )
    await discovery_engine.start()

    yield

    # Teardown
    if discovery_engine:
        await discovery_engine.stop()
    if transfer_engine:
        await transfer_engine.stop()

app = FastAPI(title=APP_NAME, lifespan=lifespan)

# Allow local frontend requests (Electron renderer & localhost dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- Models -----------------
class SendRequest(BaseModel):
    peer_ip: str
    peer_port: int
    peer_id: str
    peer_name: str
    file_paths: List[str]

class AcceptRequest(BaseModel):
    save_path: Optional[str] = None

class ConnectManualRequest(BaseModel):
    ip: str
    port: Optional[int] = DEFAULT_DISCOVERY_PORT

class PairRequest(BaseModel):
    device_id: str
    action: str  # 'pair', 'unpair', 'trust'

class DiagnosticPingRequest(BaseModel):
    ip: str
    port: Optional[int] = DEFAULT_TRANSFER_PORT

# ----------------- Endpoints -----------------

@app.get("/api/logs")
async def get_logs():
    return {"logs": list(ring_log_handler.logs)}

@app.post("/api/logs/clear")
async def clear_logs():
    ring_log_handler.logs.clear()
    return {"status": "ok"}

@app.post("/api/diagnostics/ping")
async def diagnostic_ping(req: DiagnosticPingRequest):
    t0 = time.time()
    ip = req.ip.strip()
    port = req.port or DEFAULT_TRANSFER_PORT
    logger.info(f"Running diagnostic ping to {ip}:{port}...")
    try:
        connect_task = asyncio.open_connection(ip, port)
        reader, writer = await asyncio.wait_for(connect_task, timeout=3.0)
        from app.protocol import encode_message, read_message
        writer.write(encode_message({"type": "PING"}))
        await writer.drain()
        pong = await asyncio.wait_for(read_message(reader), timeout=2.0)
        writer.close()
        try:
            await writer.wait_closed()
        except Exception:
            pass
        rtt = int((time.time() - t0) * 1000)
        logger.info(f"Diagnostic ping to {ip}:{port} SUCCESS: {pong} ({rtt}ms)")
        return {
            "success": True,
            "ip": ip,
            "port": port,
            "rtt_ms": rtt,
            "device_id": pong.get("device_id", "peer"),
            "device_name": pong.get("device_name", "WireDrop Peer"),
            "message": f"Connected! Peer '{pong.get('device_name')}' answered on port {port} in {rtt}ms."
        }
    except asyncio.TimeoutError:
        logger.warning(f"Diagnostic ping to {ip}:{port} timed out")
        return {
            "success": False,
            "ip": ip,
            "port": port,
            "error": "Timeout",
            "message": f"Connection timed out to {ip}:{port}. Check if WireDrop is open on the target PC and Windows Firewall allows incoming connections on port {port}."
        }
    except Exception as e:
        logger.warning(f"Diagnostic ping to {ip}:{port} failed: {e}")
        return {
            "success": False,
            "ip": ip,
            "port": port,
            "error": str(e),
            "message": f"Cannot connect to {ip}:{port} ({e}). Ensure Ethernet cable is connected and both computers are on the same subnet (e.g. 192.168.x.x or 169.254.x.x)."
        }

# ----------------- Endpoints -----------------

@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "app": APP_NAME,
        "discovery_running": discovery_engine.running if discovery_engine else False,
        "transfer_listening": transfer_engine.server is not None if transfer_engine else False
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_websockets.append(websocket)
    try:
        while True:
            # Keep-alive receive
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        if websocket in connected_websockets:
            connected_websockets.remove(websocket)

@app.get("/api/network/interfaces")
async def list_interfaces():
    return {
        "interfaces": get_network_interfaces(),
        "best_lan": get_best_lan_ip()
    }

@app.get("/api/network/status")
async def network_status():
    best = get_best_lan_ip()
    online_peers = discovery_engine.get_online_peers() if discovery_engine else []
    active_count = len(transfer_engine.active_transfers) if transfer_engine else 0
    return {
        "is_connected": best["is_up"] if best else False,
        "active_interface": best["interface_name"] if best else "None",
        "local_ip": best["ip_address"] if best else "127.0.0.1",
        "is_ethernet": best["is_ethernet"] if best else False,
        "speed_mbps": best["speed_mbps"] if best else 0,
        "discovered_devices_count": len(online_peers),
        "active_transfers_count": active_count
    }

@app.get("/api/devices")
async def list_devices():
    online_ids = [p["device_id"] for p in discovery_engine.get_online_peers()] if discovery_engine else []
    return {
        "devices": get_devices(online_ids),
        "online_peers": discovery_engine.get_online_peers() if discovery_engine else []
    }

@app.post("/api/devices/connect")
async def connect_manual_device(req: ConnectManualRequest):
    if not discovery_engine:
        raise HTTPException(status_code=500, detail="Discovery engine not ready")
    res = await discovery_engine.add_manual_peer(req.ip, req.port or DEFAULT_DISCOVERY_PORT)
    return {"status": "success", "result": res}

@app.delete("/api/devices/{device_id}")
async def remove_device(device_id: str):
    if discovery_engine:
        discovery_engine.remove_peer(device_id)
    delete_device(device_id)
    await broadcast_ws_event({"event": "device_lost", "data": {"device_id": device_id}})
    return {"status": "success", "device_id": device_id}

@app.post("/api/devices/pair")
async def pair_device(req: PairRequest):
    if req.action == "trust":
        update_device_pairing(req.device_id, "trusted")
    elif req.action == "pair":
        update_device_pairing(req.device_id, "paired")
    elif req.action == "unpair":
        update_device_pairing(req.device_id, "unpaired")
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
    return {"status": "success", "device_id": req.device_id, "paired_status": req.action}

@app.post("/api/transfers/send")
async def send_files(req: SendRequest):
    if not transfer_engine:
        raise HTTPException(status_code=500, detail="Transfer engine not ready")
    if not req.file_paths:
        raise HTTPException(status_code=400, detail="No files or folders selected")
    for p in req.file_paths:
        if not os.path.exists(p):
            raise HTTPException(status_code=404, detail=f"Path not found: {p}")
            
    transfer_id = await transfer_engine.start_send_transfer(
        peer_ip=req.peer_ip,
        peer_port=req.peer_port,
        peer_id=req.peer_id,
        peer_name=req.peer_name,
        file_paths=req.file_paths
    )
    return {"status": "started", "transfer_id": transfer_id}

@app.get("/api/transfers")
async def list_active_transfers():
    if not transfer_engine:
        return {"active": []}
    res = []
    for tid, s in transfer_engine.active_transfers.items():
        res.append({
            "transfer_id": tid,
            "direction": s.direction,
            "peer_id": s.peer_id,
            "peer_name": s.peer_name,
            "total_bytes": s.total_bytes,
            "transferred_bytes": s.transferred_bytes,
            "status": s.status,
            "items_count": len(s.items)
        })
    return {"active": res}

@app.get("/api/transfers/{transfer_id}")
async def get_transfer(transfer_id: str):
    details = get_transfer_details(transfer_id)
    if not details:
        raise HTTPException(status_code=404, detail="Transfer not found")
    return details

@app.post("/api/transfers/{transfer_id}/accept")
async def accept_incoming(transfer_id: str, req: AcceptRequest):
    if not transfer_engine:
        raise HTTPException(status_code=500, detail="Transfer engine not ready")
    transfer_engine.accept_transfer(transfer_id, req.save_path)
    return {"status": "accepted", "transfer_id": transfer_id}

@app.post("/api/transfers/{transfer_id}/reject")
async def reject_incoming(transfer_id: str):
    if not transfer_engine:
        raise HTTPException(status_code=500, detail="Transfer engine not ready")
    transfer_engine.reject_transfer(transfer_id)
    return {"status": "rejected", "transfer_id": transfer_id}

@app.post("/api/transfers/{transfer_id}/cancel")
async def cancel_transfer(transfer_id: str):
    if not transfer_engine:
        raise HTTPException(status_code=500, detail="Transfer engine not ready")
    transfer_engine.cancel_transfer(transfer_id)
    return {"status": "cancelled", "transfer_id": transfer_id}

@app.get("/api/history")
async def get_history(limit: int = 50):
    return {"history": get_transfers_history(limit)}

@app.delete("/api/history")
async def clear_transfers_history():
    clear_history()
    return {"status": "history_cleared"}

@app.get("/api/settings")
async def read_settings():
    return load_settings()

@app.put("/api/settings")
async def update_settings(cfg: AppSettings):
    save_settings(cfg)
    if discovery_engine:
        discovery_engine.device_name = cfg.device_name
        asyncio.create_task(discovery_engine.broadcast_beacon_once())
    if transfer_engine:
        transfer_engine.device_name = cfg.device_name
    logger.info(f"Updated settings: local device name is now '{cfg.device_name}'")
    return {"status": "saved", "settings": cfg}

# ----------------- Quick Share App Installer Over LAN -----------------

def get_bundle_paths():
    """Finds the local LANShare.exe and ZIP distribution package."""
    candidates_zip = [
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "release", "LANShare-Windows-x64.zip")),
        os.path.abspath(os.path.join(os.getcwd(), "release", "LANShare-Windows-x64.zip")),
        os.path.abspath(os.path.join(sys.executable, "..", "..", "release", "LANShare-Windows-x64.zip")),
    ]
    candidates_exe = [
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "release", "LANShare-win32-x64", "LANShare.exe")),
        os.path.abspath(os.path.join(os.getcwd(), "release", "LANShare-win32-x64", "LANShare.exe")),
        os.path.abspath(os.path.join(sys.executable, "..", "..", "release", "LANShare-win32-x64", "LANShare.exe")),
    ]
    zip_path = next((p for p in candidates_zip if os.path.exists(p)), None)
    exe_path = next((p for p in candidates_exe if os.path.exists(p)), None)
    return zip_path, exe_path

@app.get("/api/share/info")
async def get_share_app_info():
    best = get_best_lan_ip()
    ip = best["ip_address"] if best else "127.0.0.1"
    zip_path, exe_path = get_bundle_paths()
    return {
        "share_url": f"http://{ip}:52522/download",
        "has_zip": zip_path is not None,
        "has_exe": exe_path is not None,
        "ip": ip,
        "port": 52522
    }

@app.get("/download", response_class=HTMLResponse)
async def web_download_landing():
    best = get_best_lan_ip()
    ip = best["ip_address"] if best else "127.0.0.1"
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Download LANShare - Instant LAN Installer</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: linear-gradient(135deg, #1E3BB3 0%, #3157D5 50%, #6B7FEA 100%);
            color: #ffffff;
            margin: 0;
            padding: 40px 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            box-sizing: border-box;
        }}
        .card {{
            background: rgba(255, 255, 255, 0.95);
            color: #20263A;
            border-radius: 28px;
            padding: 45px 35px;
            max-width: 520px;
            width: 100%;
            box-shadow: 0 25px 60px rgba(0,0,0,0.3);
            text-align: center;
        }}
        .badge {{
            display: inline-block;
            background: rgba(49, 87, 213, 0.1);
            color: #3157D5;
            padding: 6px 14px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 16px;
        }}
        h1 {{
            margin: 0 0 10px;
            font-size: 28px;
            font-weight: 900;
            letter-spacing: -0.5px;
        }}
        p {{
            color: #758096;
            font-size: 14px;
            line-height: 1.5;
            margin: 0 0 30px;
        }}
        .btn {{
            display: block;
            width: 100%;
            background: linear-gradient(135deg, #3157D5 0%, #486EE6 100%);
            color: #ffffff;
            padding: 16px 24px;
            border-radius: 18px;
            font-weight: 700;
            font-size: 15px;
            text-decoration: none;
            box-shadow: 0 10px 25px rgba(49, 87, 213, 0.35);
            transition: all 0.2s ease;
            box-sizing: border-box;
            margin-bottom: 14px;
        }}
        .btn:hover {{
            transform: translateY(-2px);
            box-shadow: 0 14px 30px rgba(49, 87, 213, 0.45);
        }}
        .steps {{
            background: #F5F7FC;
            border-radius: 18px;
            padding: 18px;
            margin-top: 25px;
            text-align: left;
            font-size: 13px;
            color: #4A5568;
        }}
        .steps ol {{
            margin: 0;
            padding-left: 20px;
        }}
        .steps li {{
            margin-bottom: 8px;
        }}
        .steps li:last-child {{
            margin-bottom: 0;
        }}
    </style>
</head>
<body>
    <div class="card">
        <span class="badge">Direct Ethernet Broadcast</span>
        <h1>Install LANShare</h1>
        <p>Your connected peer computer ({ip}) is sharing the LANShare application with you over your local Ethernet cable.</p>
        
        <a href="/download/app" class="btn">⬇ Download LANShare Package (.zip)</a>
        
        <div class="steps">
            <strong>Next steps on this computer:</strong>
            <ol>
                <li>Click <b>Download LANShare Package</b>.</li>
                <li>Right-click the downloaded zip and choose <b>Extract All</b>.</li>
                <li>Double click <b>LANShare.exe</b> to launch!</li>
                <li>Both computers will automatically connect to transfer files at full speed.</li>
            </ol>
        </div>
    </div>
</body>
</html>"""
    return HTMLResponse(content=html)

@app.get("/download/app")
async def download_app_bundle():
    zip_path, exe_path = get_bundle_paths()
    if zip_path and os.path.exists(zip_path):
        return FileResponse(zip_path, media_type="application/zip", filename="LANShare-Windows-x64.zip")
    elif exe_path and os.path.exists(exe_path):
        return FileResponse(exe_path, media_type="application/octet-stream", filename="LANShare.exe")
    raise HTTPException(status_code=404, detail="Installation package not found on host machine.")
