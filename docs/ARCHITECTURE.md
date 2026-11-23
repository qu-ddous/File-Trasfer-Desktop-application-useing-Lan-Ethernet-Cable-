# LANShare Architecture & Specifications

## 1. System Overview
LANShare is an offline-first Windows desktop application for transferring files, folders, and data directly between computers connected via Ethernet LAN.

```
+-------------------------------------------------------------+
|                     Electron Desktop App                    |
|  +-------------------------------------------------------+  |
|  |           React 18 + TailwindCSS + Lucide             |  |
|  |  (Dashboard, Send, Receive, Devices, Transfers, etc.) |  |
|  +---------------------------+---------------------------+  |
|                              | ContextBridge / IPC          |
|  +---------------------------v---------------------------+  |
|  |             Electron Main Process (Node.js)           |  |
|  |   - Process supervisor (starts & monitors Python)      |  |
|  |   - Native file/folder pickers & Tray & Windows       |  |
|  +---------------------------+---------------------------+  |
+------------------------------|------------------------------+
                               | Localhost REST & WebSocket (Auth Token)
+------------------------------v------------------------------+
|                     Python 3.11+ Backend                    |
|  +-------------------------------------------------------+  |
|  |          FastAPI Local Management API (127.0.0.1)     |  |
|  +---------------------------+---------------------------+  |
|  | SQLite (DB) | Discovery (UDP:52520) | Transfer (TCP:52521)|  |
|  +-------------------------------------------------------+  |
+-------------------------------------------------------------+
```

## 2. Networking Engine Protocols
- **UDP Broadcast Discovery (Port 52520)**:
  - Broadcast beacon sent every 3 seconds to `255.255.255.255` and subnet broadcast addresses.
  - JSON packet: `{"magic": "LANSHARE", "version": "1.0", "type": "BEACON", "device_id": "...", "device_name": "...", "transfer_port": 52521, "api_port": 52522, "os": "Windows", "addresses": [...]}`
  - Peer response / heartbeat tracking: Devices expire if no beacon is received within 10 seconds.
- **TCP Transfer Engine (Port 52521)**:
  - Length-prefixed binary framing: `[4 bytes big-endian length][JSON payload]` for control messages.
  - For chunk streaming: `[4 bytes length][MAGIC 0x4C53][MSG_TYPE: 1 byte][TRANSFER_ID: 16 bytes UUID][CHUNK_INDEX: 4 bytes][FLAGS: 1 byte][CHUNK_LEN: 4 bytes][DATA: N bytes]`
  - End-to-end file verification: Streaming SHA-256 computed on both sender and receiver.
- **Security & Authorization**:
  - Receiver approval mandatory: Transfer requests must be explicitly approved via UI or auto-approved only if device is explicitly marked 'Trusted'.
  - Path traversal defense: Relative paths strictly sanitized against `..`, leading slashes, and Windows drive letters.
  - Application session token between Electron and FastAPI backend.
