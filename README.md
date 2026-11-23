# LANShare — Offline High-Speed LAN File Transfer

LANShare is a desktop application designed to stream files and directories directly between computers over a local Ethernet cable or LAN switch without internet access or third-party servers.

## Key Capabilities
- **Direct LAN Streaming**: Utilizes native TCP sockets on port `52521` with high-throughput chunking.
- **Auto Peer Discovery**: Automatic device discovery beacon via UDP broadcast on port `52520`.
- **Integrity Guarantee**: End-to-end cryptographic SHA-256 verification computed on both sides before file finalization.
- **Path Traversal Protection**: Complete sanitization against directory traversal attacks.
- **Folder Preservation**: Recursively preserves directory hierarchies and supports empty folders.
- **Local Persistence**: Stores paired devices and transfer logs in SQLite.

## Quick Start (Development)

### 1. Requirements
- Node.js 18+ & npm
- Python 3.11+

### 2. Backend Setup
```powershell
cd backend
python -m pip install -r requirements.txt
python run.py
```
Backend API will start at `http://127.0.0.1:52522`.

### 3. Frontend Setup
```powershell
npm install
npm run dev
```
Open `http://localhost:5173` in your browser or run:
```powershell
npm run electron:dev
```

## Running Tests
```powershell
cd backend
python -m pytest tests -v
```

## How to Connect Two Computers via Ethernet Cable

1. **Connect Cable**: Plug an RJ-45 Ethernet cable directly between Computer A and Computer B.
2. **IP Addressing**: Windows automatically assigns link-local addresses (`169.254.x.x`) via APIPA if no DHCP server is present. Alternatively, assign static IPs:
   - Computer A: `192.168.1.10`, subnet mask `255.255.255.0`
   - Computer B: `192.168.1.11`, subnet mask `255.255.255.0`
3. **Launch LANShare**: Open the application on both computers.
4. **Auto-Discovery**: Devices will detect each other automatically within 3 seconds.
5. **Send Files**: Select files or entire folders, choose the target device, and click **Send Files Now**.
6. **Accept on Receiver**: The receiving computer prompts for confirmation. Once accepted, files stream at full link speed with SHA-256 validation.
