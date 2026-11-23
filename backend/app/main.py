import asyncio
import logging
import os
import sys
from typing import List, Dict, Any, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

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
    return {"status": "saved", "settings": cfg}
