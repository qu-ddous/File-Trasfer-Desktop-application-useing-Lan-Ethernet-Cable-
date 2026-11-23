# Network Setup Guide for LANShare

## 1. Physical Connection
Connect both computers directly using a standard Cat5e, Cat6, or Cat7 Ethernet cable (auto-MDIX is supported on all modern network adapters, so crossover cables are not required) or plug both into the same Ethernet switch.

## 2. IP Configuration Options

### Option A: Automatic Link-Local (Zero-Config / APIPA)
- Connect the Ethernet cable between the two PCs.
- Windows automatically assigns an IP address in the `169.254.0.0/16` subnet within 15-30 seconds.
- LANShare UDP discovery beacons broadcast on `255.255.255.255` and automatically discover peers.

### Option B: Static IP Setup (Recommended for deterministic high performance)
**Computer 1**:
- IP address: `192.168.1.10`
- Subnet mask: `255.255.255.0`
- Default gateway: *leave blank*

**Computer 2**:
- IP address: `192.168.1.11`
- Subnet mask: `255.255.255.0`
- Default gateway: *leave blank*

## 3. Windows Firewall Configuration
Ensure inbound connections are permitted for LANShare ports:
- **Port 52520 (UDP)**: LAN peer discovery beacons
- **Port 52521 (TCP)**: High-speed peer-to-peer file stream
- **Port 52522 (TCP)**: Localhost API (bound strictly to `127.0.0.1`)

Run in PowerShell as Administrator if needed:
```powershell
New-NetFirewallRule -DisplayName "LANShare Discovery" -Direction Inbound -LocalPort 52520 -Protocol UDP -Action Allow
New-NetFirewallRule -DisplayName "LANShare Transfer" -Direction Inbound -LocalPort 52521 -Protocol TCP -Action Allow
```
