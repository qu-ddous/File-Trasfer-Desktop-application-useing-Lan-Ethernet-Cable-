import asyncio
import os
import time
import uuid
import struct
import logging
from typing import Dict, Any, List, Optional, Callable
from app.protocol import (
    encode_message,
    read_message,
    read_exact,
    sanitize_relative_path,
    calculate_sha256,
    HEADER_FORMAT,
    HEADER_SIZE
)
from app.database import (
    create_transfer_record,
    update_transfer_status,
    load_settings
)

logger = logging.getLogger(__name__)

class TransferSession:
    def __init__(self, transfer_id: str, direction: str, peer_id: str, peer_name: str, total_bytes: int):
        self.transfer_id = transfer_id
        self.direction = direction
        self.peer_id = peer_id
        self.peer_name = peer_name
        self.total_bytes = total_bytes
        self.transferred_bytes = 0
        self.status = "pending"
        self.start_time = time.time()
        self.cancelled = False
        self.error: Optional[str] = None
        self.items: List[Dict[str, Any]] = []
        self.save_path: str = ""

class TransferEngine:
    def __init__(
        self,
        device_id: str,
        device_name: str,
        port: int,
        broadcast_event_cb: Optional[Callable[[Dict[str, Any]], Any]] = None
    ):
        self.device_id = device_id
        self.device_name = device_name
        self.port = port
        self.broadcast_event_cb = broadcast_event_cb
        self.server = None
        self.active_transfers: Dict[str, TransferSession] = {}
        self.incoming_requests: Dict[str, asyncio.Event] = {} # transfer_id -> acceptance event
        self.pending_requests_data: Dict[str, Dict[str, Any]] = {} # transfer_id -> modal payload
        self.request_decisions: Dict[str, bool] = {}          # transfer_id -> accepted/rejected
        self.custom_save_paths: Dict[str, str] = {}           # transfer_id -> chosen folder

    async def start(self):
        """Starts TCP transfer listener on port 52521."""
        logger.info(f"Starting TCP Transfer Server on port {self.port}...")
        self.server = await asyncio.start_server(
            self._handle_client_connection,
            host="0.0.0.0",
            port=self.port
        )
        logger.info(f"TCP Transfer Server listening on 0.0.0.0:{self.port}")

    async def stop(self):
        if self.server:
            self.server.close()
            await self.server.wait_closed()
            logger.info("TCP Transfer Server stopped.")

    async def _emit_event(self, event_type: str, data: Dict[str, Any]):
        if self.broadcast_event_cb:
            try:
                await self.broadcast_event_cb({"event": event_type, "data": data})
            except Exception as e:
                logger.error(f"Error emitting event {event_type}: {e}")

    # ================= RECEIVER SIDE =================
    async def _handle_client_connection(self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
        peer_addr = writer.get_extra_info("peername")
        logger.info(f"Incoming TCP connection from {peer_addr}")
        transfer_id = None
        try:
            # 1. Read handshake / transfer request
            request = await read_message(reader)
            req_type = request.get("type")

            if req_type == "PING":
                # Quick peer verification
                response = {
                    "type": "PONG",
                    "device_id": self.device_id,
                    "device_name": self.device_name
                }
                writer.write(encode_message(response))
                await writer.drain()
                writer.close()
                await writer.wait_closed()
                return

            if req_type != "TRANSFER_REQUEST":
                writer.write(encode_message({"status": "error", "message": "Unknown request type"}))
                await writer.drain()
                writer.close()
                return

            transfer_id = request["transfer_id"]
            sender_id = request["sender_id"]
            sender_name = request["sender_name"]
            total_items = request.get("total_items", 1)
            total_bytes = request.get("total_bytes", 0)
            items = request.get("items", [])

            settings = load_settings()
            save_path = settings.download_path

            # Create DB transfer record
            create_transfer_record(
                transfer_id=transfer_id,
                direction="receive",
                peer_device_id=sender_id,
                peer_device_name=sender_name,
                peer_ip=peer_addr[0],
                total_items=total_items,
                total_bytes=total_bytes,
                save_path=save_path,
                items=items
            )

            session = TransferSession(transfer_id, "receive", sender_id, sender_name, total_bytes)
            session.items = items
            session.save_path = save_path
            self.active_transfers[transfer_id] = session

            # Check if auto-accept is enabled (default False so receiver always gets popup prompt)
            auto_accept = getattr(settings, "auto_accept_all", False)
            if not auto_accept and getattr(settings, "auto_accept_trusted", False):
                from app.database import get_devices
                saved_devices = get_devices()
                is_trusted = any(
                    (d.get("device_id") == sender_id or d.get("last_known_ip") == peer_addr[0])
                    and d.get("paired_status") in ("trusted", "paired")
                    for d in saved_devices
                )
                if is_trusted:
                    auto_accept = True

            if not auto_accept:
                # Notify UI about incoming request
                event_obj = asyncio.Event()
                self.incoming_requests[transfer_id] = event_obj
                req_payload = {
                    "transfer_id": transfer_id,
                    "sender_id": sender_id,
                    "sender_name": sender_name,
                    "peer_ip": peer_addr[0],
                    "total_items": total_items,
                    "total_bytes": total_bytes,
                    "items": items,
                    "default_save_path": save_path,
                    "timestamp": time.time()
                }
                self.pending_requests_data[transfer_id] = req_payload

                await self._emit_event("incoming_transfer_request", req_payload)

                # Wait for user decision (max 120 seconds timeout)
                try:
                    await asyncio.wait_for(event_obj.wait(), timeout=120.0)
                except asyncio.TimeoutError:
                    self.request_decisions[transfer_id] = False

                self.pending_requests_data.pop(transfer_id, None)
                accepted = self.request_decisions.get(transfer_id, False)
                if transfer_id in self.custom_save_paths:
                    save_path = self.custom_save_paths[transfer_id]
                    session.save_path = save_path
            else:
                accepted = True
                await self._emit_event("incoming_transfer_started", {
                    "transfer_id": transfer_id,
                    "sender_id": sender_id,
                    "sender_name": sender_name,
                    "peer_ip": peer_addr[0],
                    "total_items": total_items,
                    "total_bytes": total_bytes,
                    "items": items,
                    "save_path": save_path
                })

            # Send response to sender
            if not accepted:
                session.status = "rejected"
                update_transfer_status(transfer_id, "rejected")
                writer.write(encode_message({"status": "rejected", "message": "Receiver rejected or timed out"}))
                await writer.drain()
                writer.close()
                await self._emit_event("transfer_rejected", {"transfer_id": transfer_id})
                return

            # Accepted: send OK
            session.status = "transferring"
            update_transfer_status(transfer_id, "transferring")
            writer.write(encode_message({"status": "accepted"}))
            await writer.drain()
            await self._emit_event("transfer_started", {"transfer_id": transfer_id})

            # Receive all items
            os.makedirs(save_path, exist_ok=True)
            last_speed_time = time.time()
            bytes_since_last = 0

            for item_idx, item in enumerate(items):
                rel_path = sanitize_relative_path(item["relative_path"])
                target_full_path = os.path.join(save_path, rel_path)
                is_dir = item.get("is_directory", False)
                expected_size = item.get("size", 0)
                expected_sha = item.get("checksum")

                if is_dir:
                    os.makedirs(target_full_path, exist_ok=True)
                    # Notify item ready
                    writer.write(encode_message({"status": "item_ready", "item_index": item_idx}))
                    await writer.drain()
                    continue

                os.makedirs(os.path.dirname(target_full_path), exist_ok=True)
                temp_file_path = target_full_path + ".part"

                writer.write(encode_message({"status": "item_ready", "item_index": item_idx}))
                await writer.drain()

                # Read binary chunks for this file
                received_for_item = 0
                with open(temp_file_path, "wb") as f_out:
                    while received_for_item < expected_size:
                        if session.cancelled:
                            raise asyncio.CancelledError("Transfer cancelled by receiver.")

                        # Read chunk length
                        chunk_header = await read_exact(reader, HEADER_SIZE)
                        chunk_len = struct.unpack(HEADER_FORMAT, chunk_header)[0]
                        chunk_data = await read_exact(reader, chunk_len)

                        f_out.write(chunk_data)
                        received_for_item += chunk_len
                        session.transferred_bytes += chunk_len
                        bytes_since_last += chunk_len

                        # Emit real progress
                        now = time.time()
                        if now - last_speed_time >= 0.5:
                            speed = bytes_since_last / (now - last_speed_time)
                            last_speed_time = now
                            bytes_since_last = 0
                            await self._emit_event("transfer_progress", {
                                "transfer_id": transfer_id,
                                "transferred_bytes": session.transferred_bytes,
                                "total_bytes": session.total_bytes,
                                "current_speed": speed,
                                "current_item": rel_path
                            })

                # Checksum verification
                actual_sha = calculate_sha256(temp_file_path)
                if expected_sha and actual_sha.lower() != expected_sha.lower():
                    if os.path.exists(temp_file_path):
                        os.remove(temp_file_path)
                    raise ValueError(f"Integrity check failed for {rel_path}. SHA mismatch.")

                # Rename verified file
                if os.path.exists(target_full_path):
                    os.remove(target_full_path)
                os.rename(temp_file_path, target_full_path)

                # Send item ACK
                writer.write(encode_message({"status": "item_verified", "item_index": item_idx}))
                await writer.drain()

            # All items complete!
            session.status = "completed"
            total_duration = max(time.time() - session.start_time, 0.001)
            avg_speed = session.transferred_bytes / total_duration
            update_transfer_status(transfer_id, "completed", transferred_bytes=session.transferred_bytes, speed=avg_speed)

            writer.write(encode_message({"status": "transfer_complete"}))
            await writer.drain()

            await self._emit_event("transfer_completed", {
                "transfer_id": transfer_id,
                "save_path": save_path,
                "transferred_bytes": session.transferred_bytes,
                "average_speed": avg_speed
            })

        except asyncio.CancelledError:
            logger.info(f"Transfer {transfer_id} cancelled.")
            if transfer_id and transfer_id in self.active_transfers:
                self.active_transfers[transfer_id].status = "cancelled"
                update_transfer_status(transfer_id, "cancelled")
                await self._emit_event("transfer_cancelled", {"transfer_id": transfer_id})
        except Exception as e:
            logger.error(f"Error during transfer receipt {transfer_id}: {e}", exc_info=True)
            if transfer_id and transfer_id in self.active_transfers:
                self.active_transfers[transfer_id].status = "failed"
                self.active_transfers[transfer_id].error = str(e)
                update_transfer_status(transfer_id, "failed", error=str(e))
                await self._emit_event("transfer_failed", {"transfer_id": transfer_id, "error": str(e)})
        finally:
            if transfer_id and transfer_id in self.active_transfers:
                del self.active_transfers[transfer_id]
            if transfer_id and transfer_id in self.incoming_requests:
                del self.incoming_requests[transfer_id]
            if transfer_id and transfer_id in self.pending_requests_data:
                del self.pending_requests_data[transfer_id]
            writer.close()
            try:
                await writer.wait_closed()
            except Exception:
                pass

    # ================= SENDER SIDE =================
    async def start_send_transfer(
        self,
        peer_ip: str,
        peer_port: int,
        peer_id: str,
        peer_name: str,
        file_paths: List[str]
    ) -> str:
        """
        Gathers files/folders, computes checksums, initiates connection,
        and streams file chunks to peer.
        """
        transfer_id = str(uuid.uuid4())

        # Build list of transfer items preserving hierarchy
        items: List[Dict[str, Any]] = []
        total_bytes = 0

        for path in file_paths:
            path_obj = os.path.abspath(path)
            if os.path.isdir(path_obj):
                base_dir_name = os.path.basename(path_obj)
                items.append({
                    "source_path": path_obj,
                    "relative_path": base_dir_name,
                    "is_directory": True,
                    "size": 0,
                    "checksum": ""
                })
                for root, dirs, files in os.walk(path_obj):
                    rel_to_base = os.path.relpath(root, path_obj)
                    for d in dirs:
                        rel = os.path.normpath(os.path.join(base_dir_name, rel_to_base, d)).replace("\\", "/")
                        items.append({
                            "source_path": os.path.join(root, d),
                            "relative_path": rel,
                            "is_directory": True,
                            "size": 0,
                            "checksum": ""
                        })
                    for f in files:
                        full_f = os.path.join(root, f)
                        rel = os.path.normpath(os.path.join(base_dir_name, rel_to_base, f)).replace("\\", "/")
                        f_size = os.path.getsize(full_f)
                        total_bytes += f_size
                        f_sha = calculate_sha256(full_f)
                        items.append({
                            "source_path": full_f,
                            "relative_path": rel,
                            "is_directory": False,
                            "size": f_size,
                            "checksum": f_sha
                        })
            elif os.path.isfile(path_obj):
                fname = os.path.basename(path_obj)
                f_size = os.path.getsize(path_obj)
                total_bytes += f_size
                f_sha = calculate_sha256(path_obj)
                items.append({
                    "source_path": path_obj,
                    "relative_path": fname,
                    "is_directory": False,
                    "size": f_size,
                    "checksum": f_sha
                })

        # Record in DB
        create_transfer_record(
            transfer_id=transfer_id,
            direction="send",
            peer_device_id=peer_id,
            peer_device_name=peer_name,
            peer_ip=peer_ip,
            total_items=len(items),
            total_bytes=total_bytes,
            save_path="",
            items=items
        )

        session = TransferSession(transfer_id, "send", peer_id, peer_name, total_bytes)
        session.items = items
        self.active_transfers[transfer_id] = session

        # Launch background sender task
        asyncio.create_task(self._send_worker(transfer_id, peer_ip, peer_port, items, session))
        return transfer_id

    async def _send_worker(
        self,
        transfer_id: str,
        peer_ip: str,
        peer_port: int,
        items: List[Dict[str, Any]],
        session: TransferSession
    ):
        reader, writer = None, None
        try:
            logger.info(f"Connecting to peer {peer_ip}:{peer_port} for transfer {transfer_id}...")
            last_err = None
            for attempt in range(1, 4):
                try:
                    connect_coro = asyncio.open_connection(peer_ip, peer_port)
                    reader, writer = await asyncio.wait_for(connect_coro, timeout=8.0)
                    break
                except (asyncio.TimeoutError, OSError) as ce:
                    last_err = ce
                    logger.warning(f"Connection attempt {attempt}/3 to {peer_ip}:{peer_port} failed: {ce}")
                    if attempt < 3:
                        await asyncio.sleep(0.8)

            if not reader or not writer:
                raise ConnectionError(f"Connection to peer {peer_ip}:{peer_port} timed out after 3 attempts ({last_err}). Ensure WireDrop is open on target PC and Windows Firewall allows port {peer_port}.")

            # 1. Send TRANSFER_REQUEST
            req_msg = {
                "type": "TRANSFER_REQUEST",
                "transfer_id": transfer_id,
                "sender_id": self.device_id,
                "sender_name": self.device_name,
                "total_items": len(items),
                "total_bytes": session.total_bytes,
                "items": [
                    {
                        "relative_path": i["relative_path"],
                        "is_directory": i["is_directory"],
                        "size": i["size"],
                        "checksum": i["checksum"]
                    }
                    for i in items
                ]
            }
            writer.write(encode_message(req_msg))
            await writer.drain()

            # 2. Wait for receiver decision (allow up to 120s for user acceptance)
            try:
                res = await asyncio.wait_for(read_message(reader), timeout=120.0)
            except asyncio.TimeoutError:
                raise ConnectionError("Receiver did not respond to transfer request within 120 seconds.")

            if res.get("status") != "accepted":
                session.status = "rejected"
                update_transfer_status(transfer_id, "rejected", error=res.get("message", "Receiver rejected"))
                await self._emit_event("transfer_rejected", {"transfer_id": transfer_id, "reason": res.get("message")})
                return

            session.status = "transferring"
            update_transfer_status(transfer_id, "transferring")
            await self._emit_event("transfer_started", {"transfer_id": transfer_id})

            chunk_size = load_settings().chunk_size
            last_speed_time = time.time()
            bytes_since_last = 0

            # 3. Send items
            for item_idx, item in enumerate(items):
                if session.cancelled:
                    raise asyncio.CancelledError("Transfer cancelled by sender.")

                # Wait for receiver item_ready signal
                ready_msg = await read_message(reader)
                if ready_msg.get("status") != "item_ready":
                    raise ConnectionError(f"Receiver not ready for item {item['relative_path']}")

                if item["is_directory"]:
                    continue

                # Stream file chunks
                with open(item["source_path"], "rb") as f_in:
                    while True:
                        if session.cancelled:
                            raise asyncio.CancelledError("Transfer cancelled by sender.")

                        chunk = f_in.read(chunk_size)
                        if not chunk:
                            break

                        # Frame binary chunk with 4-byte length prefix
                        chunk_header = struct.pack(HEADER_FORMAT, len(chunk))
                        writer.write(chunk_header + chunk)
                        await writer.drain()

                        session.transferred_bytes += len(chunk)
                        bytes_since_last += len(chunk)

                        now = time.time()
                        if now - last_speed_time >= 0.5:
                            speed = bytes_since_last / (now - last_speed_time)
                            last_speed_time = now
                            bytes_since_last = 0
                            await self._emit_event("transfer_progress", {
                                "transfer_id": transfer_id,
                                "transferred_bytes": session.transferred_bytes,
                                "total_bytes": session.total_bytes,
                                "current_speed": speed,
                                "current_item": item["relative_path"]
                            })

                # Await verification acknowledgement from receiver
                verify_ack = await read_message(reader)
                if verify_ack.get("status") != "item_verified":
                    raise ValueError(f"Integrity check failed on receiver for {item['relative_path']}")

            # 4. Wait for transfer_complete
            completion = await read_message(reader)
            session.status = "completed"
            total_duration = max(time.time() - session.start_time, 0.001)
            avg_speed = session.transferred_bytes / total_duration
            update_transfer_status(transfer_id, "completed", transferred_bytes=session.transferred_bytes, speed=avg_speed)

            await self._emit_event("transfer_completed", {
                "transfer_id": transfer_id,
                "transferred_bytes": session.transferred_bytes,
                "average_speed": avg_speed
            })

        except asyncio.CancelledError:
            session.status = "cancelled"
            update_transfer_status(transfer_id, "cancelled")
            await self._emit_event("transfer_cancelled", {"transfer_id": transfer_id})
        except Exception as e:
            logger.error(f"Sender error on transfer {transfer_id}: {e}", exc_info=True)
            session.status = "failed"
            session.error = str(e)
            update_transfer_status(transfer_id, "failed", error=str(e))
            await self._emit_event("transfer_failed", {"transfer_id": transfer_id, "error": str(e)})
        finally:
            if transfer_id in self.active_transfers:
                del self.active_transfers[transfer_id]
            if writer:
                writer.close()
                try:
                    await writer.wait_closed()
                except Exception:
                    pass

    def accept_transfer(self, transfer_id: str, save_path: Optional[str] = None):
        """Called by FastAPI when user clicks Accept in Receive Files screen."""
        self.pending_requests_data.pop(transfer_id, None)
        if save_path:
            self.custom_save_paths[transfer_id] = save_path
        self.request_decisions[transfer_id] = True
        if transfer_id in self.incoming_requests:
            self.incoming_requests[transfer_id].set()

    def reject_transfer(self, transfer_id: str):
        """Called by FastAPI when user clicks Reject."""
        self.pending_requests_data.pop(transfer_id, None)
        self.request_decisions[transfer_id] = False
        if transfer_id in self.incoming_requests:
            self.incoming_requests[transfer_id].set()

    def cancel_transfer(self, transfer_id: str):
        """Called by FastAPI when user cancels active transfer."""
        if transfer_id in self.active_transfers:
            self.active_transfers[transfer_id].cancelled = True
