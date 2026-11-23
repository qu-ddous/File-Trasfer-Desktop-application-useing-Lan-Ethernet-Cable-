import sqlite3
import os
import json
import uuid
import socket
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from app.config import DB_PATH, AppSettings, DEFAULT_DOWNLOAD_DIR

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Settings table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );
    """)

    # Devices table (discovered and paired peers)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS devices (
        device_id TEXT PRIMARY KEY,
        device_name TEXT NOT NULL,
        last_known_ip TEXT NOT NULL,
        mac_address TEXT,
        transfer_port INTEGER NOT NULL,
        paired_status TEXT DEFAULT 'unpaired',
        pairing_code TEXT,
        first_seen TEXT NOT NULL,
        last_seen TEXT NOT NULL
    );
    """)

    # Transfers table (Overall sessions)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS transfers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transfer_id TEXT NOT NULL,
        direction TEXT NOT NULL,            -- 'send' or 'receive'
        peer_device_id TEXT NOT NULL,
        peer_device_name TEXT NOT NULL,
        peer_ip TEXT NOT NULL,
        total_items INTEGER DEFAULT 1,
        total_bytes INTEGER DEFAULT 0,
        transferred_bytes INTEGER DEFAULT 0,
        status TEXT NOT NULL,                -- 'pending', 'transferring', 'completed', 'failed', 'cancelled', 'rejected'
        error_message TEXT,
        started_at TEXT NOT NULL,
        completed_at TEXT,
        average_speed REAL DEFAULT 0.0,
        save_path TEXT,
        UNIQUE(transfer_id, direction)
    );
    """)

    # Transfer items table (Individual files/directories in a transfer)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS transfer_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transfer_id TEXT NOT NULL,
        direction TEXT DEFAULT 'send',
        relative_path TEXT NOT NULL,
        is_directory INTEGER DEFAULT 0,
        size INTEGER DEFAULT 0,
        transferred_bytes INTEGER DEFAULT 0,
        checksum TEXT,
        status TEXT DEFAULT 'pending'
    );
    """)

    conn.commit()

    # Initialize default settings if absent
    cursor.execute("SELECT value FROM settings WHERE key='config'")
    row = cursor.fetchone()
    if not row:
        hostname = socket.gethostname()
        dev_id = str(uuid.uuid4())
        token = str(uuid.uuid4())
        default_cfg = AppSettings(
            device_name=hostname,
            device_id=dev_id,
            download_path=DEFAULT_DOWNLOAD_DIR,
            api_token=token
        )
        cursor.execute("INSERT INTO settings (key, value) VALUES ('config', ?)", (default_cfg.model_dump_json(),))
        conn.commit()

    conn.close()

def load_settings() -> AppSettings:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM settings WHERE key='config'")
    row = cursor.fetchone()
    conn.close()
    if row:
        data = json.loads(row["value"])
        return AppSettings(**data)
    else:
        init_db()
        return load_settings()

def save_settings(settings: AppSettings):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('config', ?)", (settings.model_dump_json(),))
    conn.commit()
    conn.close()

def upsert_device(device_id: str, device_name: str, ip: str, port: int, mac: Optional[str] = None):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    cursor.execute("SELECT paired_status, pairing_code, first_seen FROM devices WHERE device_id = ?", (device_id,))
    row = cursor.fetchone()
    if row:
        cursor.execute("""
            UPDATE devices 
            SET device_name = ?, last_known_ip = ?, transfer_port = ?, last_seen = ?
            WHERE device_id = ?
        """, (device_name, ip, port, now, device_id))
    else:
        cursor.execute("""
            INSERT INTO devices (device_id, device_name, last_known_ip, mac_address, transfer_port, paired_status, first_seen, last_seen)
            VALUES (?, ?, ?, ?, ?, 'unpaired', ?, ?)
        """, (device_id, device_name, ip, mac, port, now, now))
    conn.commit()
    conn.close()

def get_devices(online_device_ids: List[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM devices ORDER BY last_seen DESC")
    rows = cursor.fetchall()
    conn.close()
    devices = []
    for r in rows:
        d = dict(r)
        d["is_online"] = (d["device_id"] in online_device_ids) if online_device_ids is not None else False
        devices.append(d)
    return devices

def update_device_pairing(device_id: str, status: str, code: Optional[str] = None):
    conn = get_connection()
    cursor = conn.cursor()
    if code is not None:
        cursor.execute("UPDATE devices SET paired_status = ?, pairing_code = ? WHERE device_id = ?", (status, code, device_id))
    else:
        cursor.execute("UPDATE devices SET paired_status = ? WHERE device_id = ?", (status, device_id))
    conn.commit()
    conn.close()

def create_transfer_record(
    transfer_id: str,
    direction: str,
    peer_device_id: str,
    peer_device_name: str,
    peer_ip: str,
    total_items: int,
    total_bytes: int,
    save_path: str,
    items: List[Dict[str, Any]]
):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    cursor.execute("""
        INSERT INTO transfers (
            transfer_id, direction, peer_device_id, peer_device_name, peer_ip,
            total_items, total_bytes, transferred_bytes, status, started_at, save_path
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'pending', ?, ?)
    """, (transfer_id, direction, peer_device_id, peer_device_name, peer_ip, total_items, total_bytes, now, save_path))
    
    for item in items:
        cursor.execute("""
            INSERT INTO transfer_items (transfer_id, relative_path, is_directory, size, transferred_bytes, status, checksum)
            VALUES (?, ?, ?, ?, 0, 'pending', ?)
        """, (transfer_id, item["relative_path"], 1 if item.get("is_directory") else 0, item.get("size", 0), item.get("checksum")))
    
    conn.commit()
    conn.close()

def update_transfer_status(transfer_id: str, status: str, direction: Optional[str] = None, transferred_bytes: Optional[int] = None, speed: Optional[float] = None, error: Optional[str] = None):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()
    completed = now if status in ('completed', 'failed', 'cancelled', 'rejected') else None
    
    updates = ["status = ?"]
    params = [status]
    if transferred_bytes is not None:
        updates.append("transferred_bytes = ?")
        params.append(transferred_bytes)
    if speed is not None:
        updates.append("average_speed = ?")
        params.append(speed)
    if error is not None:
        updates.append("error_message = ?")
        params.append(error)
    if completed is not None:
        updates.append("completed_at = ?")
        params.append(completed)
    params.append(transfer_id)
    
    where_clause = "WHERE transfer_id = ?"
    if direction:
        where_clause += " AND direction = ?"
        params.append(direction)
        
    cursor.execute(f"UPDATE transfers SET {', '.join(updates)} {where_clause}", params)
    conn.commit()
    conn.close()

def get_transfers_history(limit: int = 50) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM transfers ORDER BY started_at DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_transfer_details(transfer_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM transfers WHERE transfer_id = ?", (transfer_id,))
    t_row = cursor.fetchone()
    if not t_row:
        conn.close()
        return None
    res = dict(t_row)
    cursor.execute("SELECT * FROM transfer_items WHERE transfer_id = ?", (transfer_id,))
    res["items"] = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return res

def clear_history():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM transfer_items")
    cursor.execute("DELETE FROM transfers")
    conn.commit()
    conn.close()
