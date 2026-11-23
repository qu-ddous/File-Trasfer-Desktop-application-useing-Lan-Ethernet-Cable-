import asyncio
import json
import logging
import socket
import time
from typing import Dict, Any, Callable, List, Optional
from app.database import upsert_device
from app.network import get_network_interfaces, get_best_lan_ip

logger = logging.getLogger(__name__)

class DiscoveryEngine:
    def __init__(
        self,
        device_id: str,
        device_name: str,
        transfer_port: int,
        discovery_port: int,
        on_device_discovered: Optional[Callable[[Dict[str, Any]], Any]] = None,
        on_device_lost: Optional[Callable[[str], Any]] = None,
    ):
        self.device_id = device_id
        self.device_name = device_name
        self.transfer_port = transfer_port
        self.discovery_port = discovery_port
        self.on_device_discovered = on_device_discovered
        self.on_device_lost = on_device_lost
        
        self.running = False
        self.known_peers: Dict[str, Dict[str, Any]] = {}  # device_id -> details
        self._listener_task: Optional[asyncio.Task] = None
        self._beacon_task: Optional[asyncio.Task] = None
        self._cleanup_task: Optional[asyncio.Task] = None
        self._transport = None

    async def start(self):
        if self.running:
            return
        self.running = True
        logger.info(f"Starting UDP Discovery on port {self.discovery_port}...")
        
        loop = asyncio.get_running_loop()
        
        # Setup UDP listener with SO_BROADCAST and SO_REUSEADDR
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        try:
            sock.bind(("", self.discovery_port))
        except Exception as e:
            logger.warning(f"Failed to bind UDP discovery port {self.discovery_port}: {e}. Retrying with SO_REUSEPORT if available.")
            sock.bind(("0.0.0.0", self.discovery_port))
        sock.setblocking(False)

        class UDPProtocol(asyncio.DatagramProtocol):
            def __init__(proto_self, engine: 'DiscoveryEngine'):
                proto_self.engine = engine

            def datagram_received(proto_self, data: bytes, addr):
                proto_self.engine._handle_datagram(data, addr)

            def error_received(proto_self, exc):
                logger.error(f"UDP Error received: {exc}")

        transport, protocol = await loop.create_datagram_endpoint(
            lambda: UDPProtocol(self),
            sock=sock
        )
        self._transport = transport

        # Start periodic beacon broadcasts
        self._beacon_task = asyncio.create_task(self._beacon_loop())
        # Start cleanup task for offline peers
        self._cleanup_task = asyncio.create_task(self._cleanup_loop())

    async def stop(self):
        self.running = False
        if self._beacon_task:
            self._beacon_task.cancel()
        if self._cleanup_task:
            self._cleanup_task.cancel()
        if self._transport:
            self._transport.close()
        logger.info("UDP Discovery stopped.")

    def _handle_datagram(self, data: bytes, addr):
        try:
            msg = json.loads(data.decode("utf-8"))
            if msg.get("magic") != "LANSHARE" or msg.get("version") != "1.0":
                return
            peer_id = msg.get("device_id")
            if not peer_id or peer_id == self.device_id:
                # Ignore self beacon
                return

            ip = addr[0]
            peer_data = {
                "device_id": peer_id,
                "device_name": msg.get("device_name", "Unknown"),
                "ip_address": ip,
                "transfer_port": msg.get("transfer_port", self.transfer_port),
                "os": msg.get("os", "Windows"),
                "last_seen": time.time()
            }

            is_new = peer_id not in self.known_peers
            self.known_peers[peer_id] = peer_data
            
            # Persist to database
            upsert_device(peer_id, peer_data["device_name"], ip, peer_data["transfer_port"])

            if is_new and self.on_device_discovered:
                asyncio.create_task(self.on_device_discovered(peer_data))

        except Exception as e:
            logger.debug(f"Error handling discovery datagram from {addr}: {e}")

    async def _beacon_loop(self):
        while self.running:
            try:
                msg = json.dumps({
                    "magic": "LANSHARE",
                    "version": "1.0",
                    "type": "BEACON",
                    "device_id": self.device_id,
                    "device_name": self.device_name,
                    "transfer_port": self.transfer_port,
                    "os": "Windows",
                    "timestamp": time.time()
                }).encode("utf-8")

                # Broadcast on 255.255.255.255 and adapter subnets
                destinations = ["255.255.255.255"]
                for iface in get_network_interfaces():
                    if iface["is_up"] and iface["broadcast"]:
                        destinations.append(iface["broadcast"])

                for target in set(destinations):
                    try:
                        self._transport.sendto(msg, (target, self.discovery_port))
                    except Exception:
                        pass
            except Exception as e:
                logger.error(f"Error in beacon loop: {e}")

            await asyncio.sleep(3.0)

    async def _cleanup_loop(self):
        while self.running:
            now = time.time()
            timeout = 10.0 # 10 seconds without beacon means peer is offline
            lost_ids = []
            for peer_id, info in list(self.known_peers.items()):
                if now - info["last_seen"] > timeout:
                    lost_ids.append(peer_id)

            for peer_id in lost_ids:
                del self.known_peers[peer_id]
                if self.on_device_lost:
                    asyncio.create_task(self.on_device_lost(peer_id))

            await asyncio.sleep(4.0)

    def get_online_peers(self) -> List[Dict[str, Any]]:
        return list(self.known_peers.values())

    async def add_manual_peer(self, ip: str, port: int) -> Optional[Dict[str, Any]]:
        """
        Manually connects or pings an IP when broadcast is blocked by network switch.
        """
        try:
            msg = json.dumps({
                "magic": "LANSHARE",
                "version": "1.0",
                "type": "PING",
                "device_id": self.device_id,
                "device_name": self.device_name,
                "transfer_port": self.transfer_port,
                "os": "Windows"
            }).encode("utf-8")
            self._transport.sendto(msg, (ip, self.discovery_port))
            return {"status": "ping_sent", "target": ip}
        except Exception as e:
            logger.error(f"Manual peer ping failed: {e}")
            return None
