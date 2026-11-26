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
        self.blocked_device_ids: set = set()
        self._listener_task: Optional[asyncio.Task] = None
        self._beacon_task: Optional[asyncio.Task] = None
        self._cleanup_task: Optional[asyncio.Task] = None
        self._transport = None

    async def start(self):
        if self.running:
            return
        self.running = True
        try:
            from app.database import get_blocked_device_ids
            self.blocked_device_ids = set(get_blocked_device_ids())
        except Exception:
            pass
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
                err_str = str(exc)
                if any(code in err_str for code in ("1231", "1232", "10051", "10065")):
                    logger.debug(f"UDP unrouted broadcast warning (cable unplugged or interface down): {exc}")
                else:
                    logger.warning(f"UDP protocol notice: {exc}")

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
            if msg.get("magic") not in ("WIREDROP", "LANSHARE") or msg.get("version") != "1.0":
                return
            peer_id = msg.get("device_id")
            if not peer_id or peer_id == self.device_id or peer_id in self.blocked_device_ids:
                # Ignore self beacon or permanently blocked/removed device
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

            old_peer = self.known_peers.get(peer_id)
            is_new = old_peer is None
            name_changed = (old_peer is not None and old_peer.get("device_name") != peer_data["device_name"])
            self.known_peers[peer_id] = peer_data
            
            # Persist to database
            upsert_device(peer_id, peer_data["device_name"], ip, peer_data["transfer_port"])

            if (is_new or name_changed) and self.on_device_discovered:
                asyncio.create_task(self.on_device_discovered(peer_data))

            # Reply with PONG directly to sender when PING or BEACON received
            msg_type = msg.get("type")
            if msg_type in ("PING", "BEACON") and self._transport:
                pong = json.dumps({
                    "magic": "WIREDROP",
                    "version": "1.0",
                    "type": "PONG",
                    "device_id": self.device_id,
                    "device_name": self.device_name,
                    "transfer_port": self.transfer_port,
                    "os": "Windows",
                    "timestamp": time.time()
                }).encode("utf-8")
                try:
                    self._transport.sendto(pong, (ip, self.discovery_port))
                except Exception:
                    pass

        except Exception as e:
            logger.debug(f"Error handling discovery datagram from {addr}: {e}")

    async def _beacon_loop(self):
        from app.database import get_devices
        while self.running:
            try:
                msg = json.dumps({
                    "magic": "WIREDROP",
                    "version": "1.0",
                    "type": "BEACON",
                    "device_id": self.device_id,
                    "device_name": self.device_name,
                    "transfer_port": self.transfer_port,
                    "os": "Windows",
                    "timestamp": time.time()
                }).encode("utf-8")

                # Broadcast on active connected adapter subnets
                destinations = []
                for iface in get_network_interfaces():
                    if iface["is_up"] and iface.get("broadcast") and iface["broadcast"] != "255.255.255.255":
                        destinations.append(iface["broadcast"])
                    ip_str = iface.get("ip_address", "")
                    if iface["is_up"] and ip_str and not ip_str.startswith("127.") and not "Unplugged" in ip_str:
                        parts = ip_str.split(".")
                        if len(parts) == 4:
                            destinations.append(f"{parts[0]}.{parts[1]}.{parts[2]}.255")

                # Fallback to global broadcast only if no specific subnet found
                if not destinations:
                    destinations.append("255.255.255.255")

                # Unicast directly to all saved device IPs from the database
                try:
                    saved_devices = get_devices()
                    for d in saved_devices:
                        target_ip = d.get("last_known_ip")
                        if target_ip and target_ip not in ("127.0.0.1", "0.0.0.0") and "Unplugged" not in target_ip:
                            destinations.append(target_ip)
                except Exception:
                    pass

                for target in set(destinations):
                    try:
                        self._transport.sendto(msg, (target, self.discovery_port))
                    except (OSError, socket.error):
                        # Silently ignore unrouted interface / unreachable host errors
                        pass
            except Exception as e:
                logger.debug(f"Error in beacon loop: {e}")

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

    def remove_peer(self, device_id: str):
        self.blocked_device_ids.add(device_id)
        self.known_peers.pop(device_id, None)
        for pid, pdata in list(self.known_peers.items()):
            if pid == device_id or pdata.get("device_id") == device_id:
                self.known_peers.pop(pid, None)

    def unblock_peer(self, device_id: str):
        self.blocked_device_ids.discard(device_id)

    async def broadcast_beacon_once(self):
        """Immediately transmits a beacon packet announcing updated name/config."""
        if not self._transport or not self.running:
            return
        try:
            msg = json.dumps({
                "magic": "WIREDROP",
                "version": "1.0",
                "type": "BEACON",
                "device_id": self.device_id,
                "device_name": self.device_name,
                "transfer_port": self.transfer_port,
                "os": "Windows",
                "timestamp": time.time()
            }).encode("utf-8")
            destinations = ["255.255.255.255"]
            for iface in get_network_interfaces():
                if iface["is_up"] and iface["broadcast"]:
                    destinations.append(iface["broadcast"])
            from app.database import get_devices
            for d in get_devices():
                target_ip = d.get("last_known_ip")
                if target_ip and target_ip not in ("127.0.0.1", "0.0.0.0"):
                    destinations.append(target_ip)
            for target in set(destinations):
                try:
                    self._transport.sendto(msg, (target, self.discovery_port))
                except Exception:
                    pass
            logger.info(f"Broadcasted updated device identity beacon: '{self.device_name}'")
        except Exception as e:
            logger.warning(f"Error broadcasting immediate beacon: {e}")

    async def add_manual_peer(self, ip: str, port: int) -> Dict[str, Any]:
        """
        Manually connects or pings an IP when broadcast is blocked by network switch.
        Persists to database immediately so it never disappears, sends UDP ping, and tests TCP reachability.
        """
        from app.database import get_devices, upsert_device
        ip = ip.strip()

        # 1. Immediately persist to database so it stays in the list!
        existing_devices = get_devices()
        existing = next((d for d in existing_devices if d.get("last_known_ip") == ip), None)
        
        peer_id = existing["device_id"] if existing else f"peer-{ip.replace('.', '-')}"
        peer_name = existing["device_name"] if existing else f"LAN PC ({ip})"
        transfer_port = existing["transfer_port"] if existing else self.transfer_port

        upsert_device(peer_id, peer_name, ip, transfer_port)

        # 2. Send direct UDP PING
        try:
            msg = json.dumps({
                "magic": "WIREDROP",
                "version": "1.0",
                "type": "PING",
                "device_id": self.device_id,
                "device_name": self.device_name,
                "transfer_port": self.transfer_port,
                "os": "Windows"
            }).encode("utf-8")
            if self._transport:
                self._transport.sendto(msg, (ip, self.discovery_port))
        except Exception as e:
            logger.warning(f"Manual peer UDP ping error: {e}")

        # 3. Active TCP socket check on transfer port (52521)
        tcp_online = False
        try:
            connect_task = asyncio.open_connection(ip, transfer_port)
            reader, writer = await asyncio.wait_for(connect_task, timeout=2.0)
            from app.protocol import encode_message, read_message
            writer.write(encode_message({"type": "PING"}))
            await writer.drain()
            try:
                pong = await asyncio.wait_for(read_message(reader), timeout=2.0)
                if isinstance(pong, dict) and pong.get("type") == "PONG":
                    peer_id = pong.get("device_id", peer_id)
                    peer_name = pong.get("device_name", peer_name)
            except Exception:
                pass
            writer.close()
            try:
                await writer.wait_closed()
            except Exception:
                pass
            tcp_online = True
        except Exception as e:
            logger.info(f"TCP socket check to {ip}:{transfer_port} failed: {e}")
            tcp_online = False

        if tcp_online:
            peer_data = {
                "device_id": peer_id,
                "device_name": peer_name,
                "ip_address": ip,
                "transfer_port": transfer_port,
                "os": "Windows",
                "last_seen": time.time()
            }
            self.known_peers[peer_id] = peer_data
            upsert_device(peer_id, peer_name, ip, transfer_port)
            return {"status": "success", "online": True, "ip": ip, "device_id": peer_id, "device_name": peer_name}

        return {"status": "saved", "online": False, "ip": ip, "device_id": peer_id, "device_name": peer_name}
