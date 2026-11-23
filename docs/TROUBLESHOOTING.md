# LANShare Troubleshooting Guide

## 1. No Devices Found via Auto-Discovery
- **Check Ethernet Link**: Ensure the network cable is securely plugged in and link lights are green/amber on both adapters.
- **Windows Firewall**: Check if UDP Port 52520 is blocked. Allow LANShare in Windows Defender Firewall.
- **Subnet Mismatch**: If using manual IPs, ensure both computers are on the same subnet (e.g. `192.168.1.10` and `192.168.1.11` with subnet mask `255.255.255.0`).
- **Use Manual Connect**: In the **Devices** tab, enter the receiver's IP address directly into the *Manual Connect by IP* input and click **Connect IP**.

## 2. Transfer Fails or Hangs
- **Port 52521 Blocked**: Verify TCP port 52521 is open between the computers.
- **Disk Space**: Ensure the target computer has sufficient storage for the incoming file payload.
- **Write Permissions**: In the **Settings** tab, verify the *Default Download Folder* is writable.

## 3. SHA-256 Verification Failed
- LANShare computes streaming SHA-256 checksums on both the sender and receiver.
- If a bad cable, severe packet drop, or disk corruption occurs, LANShare discards the `.part` file and marks the transfer failed to guarantee zero corrupted files land on your drive.
- Replace or re-seat the Ethernet cable and re-initiate the transfer.
