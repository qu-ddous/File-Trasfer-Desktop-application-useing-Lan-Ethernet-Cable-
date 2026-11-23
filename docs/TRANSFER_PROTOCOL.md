# LANShare Binary Transfer Protocol Specification

## Overview
LANShare utilizes a reliable TCP protocol with explicit message framing and end-to-end cryptographic checksum verification.

## 1. Framing Architecture
TCP is an unstructured byte stream. To eliminate framing ambiguity, LANShare uses length-prefixed protocol frames:
```
+-----------------------------------+-----------------------------------+
|     4 Bytes (Big-Endian UInt32)   |              Payload              |
|        Payload Length (N)         |             (N Bytes)             |
+-----------------------------------+-----------------------------------+
```

## 2. Message Types

### Handshake / Transfer Request
Sent from Sender to Receiver on connect:
```json
{
  "type": "TRANSFER_REQUEST",
  "transfer_id": "c1f7a184-63bd-47a4-845f-4bf143899214",
  "sender_id": "dev-01",
  "sender_name": "Workstation-A",
  "total_items": 3,
  "total_bytes": 104857600,
  "items": [
    {
      "relative_path": "Dataset/file1.bin",
      "is_directory": false,
      "size": 52428800,
      "checksum": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    }
  ]
}
```

### Receiver Response
- Accepted: `{"status": "accepted"}`
- Rejected: `{"status": "rejected", "message": "User declined"}`

### Stream Chunking
For non-directory files:
1. Sender waits for `{"status": "item_ready", "item_index": N}`.
2. Sender transmits binary chunks of up to 512 KB, each prefixed with its 4-byte length.
3. Receiver streams chunks directly into `<filename>.part` and updates streaming SHA-256.
4. Receiver verifies calculated hash against expected hash.
5. On match, Receiver atomicaly renames `.part` to final filename and responds with `{"status": "item_verified", "item_index": N}`.
6. Sender proceeds to next item.
