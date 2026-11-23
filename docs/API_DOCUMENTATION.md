# LANShare REST & WebSocket API Documentation

All management endpoints bind exclusively to `http://127.0.0.1:52522/api` and are never exposed to the external LAN.

## 1. System Health
- **GET `/api/health`**
  - Returns backend readiness status, discovery state, and transfer listener state.
  - Response:
    ```json
    {
      "status": "ok",
      "app": "LANShare",
      "discovery_running": true,
      "transfer_listening": true
    }
    ```

## 2. Network & Interfaces
- **GET `/api/network/interfaces`**
  - Lists all network adapters, IP addresses, MAC addresses, link speeds, and auto-detects active Ethernet cards.
- **GET `/api/network/status`**
  - Returns connection state, primary LAN IP, adapter name, and link status.

## 3. LAN Device Discovery
- **GET `/api/devices`**
  - Returns both active online peers (last beacon < 10s) and known cached devices from SQLite.
- **POST `/api/devices/connect`**
  - Body: `{"ip": "192.168.1.50", "port": 52520}`
  - Sends direct UDP discovery packet when broadcast is restricted.
- **POST `/api/devices/pair`**
  - Body: `{"device_id": "...", "action": "trust" | "pair" | "unpair"}`

## 4. Transfers Engine
- **POST `/api/transfers/send`**
  - Body:
    ```json
    {
      "peer_ip": "192.168.1.15",
      "peer_port": 52521,
      "peer_id": "peer-uuid",
      "peer_name": "Workstation-B",
      "file_paths": ["C:\\Data\\Video.mp4", "C:\\Data\\ProjectsFolder"]
    }
    ```
- **GET `/api/transfers`**
  - Returns real-time list of in-flight file streams with bytes transferred and speed.
- **POST `/api/transfers/{transfer_id}/accept`**
  - Authorizes incoming transfer and optionally overrides destination save directory.
- **POST `/api/transfers/{transfer_id}/reject`**
  - Rejects incoming transfer.
- **POST `/api/transfers/{transfer_id}/cancel`**
  - Aborts in-flight transfer.

## 5. History & Settings
- **GET `/api/history`**: Returns historical transfer audit log.
- **DELETE `/api/history`**: Clears historical transfer logs.
- **GET `/api/settings`**: Retrieves device configuration.
- **PUT `/api/settings`**: Updates and persists preferences.

## 6. Live WebSocket (`ws://127.0.0.1:52522/ws`)
Events broadcasted in real time:
- `device_discovered`: Emitted when new peer beacon is detected.
- `device_lost`: Emitted when peer stops beaconing.
- `incoming_transfer_request`: Emitted when remote sender requests approval.
- `transfer_started`: Emitted upon approval and stream startup.
- `transfer_progress`: Emitted with real byte counts and speed.
- `transfer_completed`: Emitted after successful SHA-256 integrity verification.
- `transfer_failed`: Emitted on transmission error or checksum mismatch.
