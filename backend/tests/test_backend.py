import pytest
import os
import tempfile
import asyncio
from app.protocol import sanitize_relative_path, calculate_sha256, encode_message
from app.network import get_network_interfaces, get_best_lan_ip
from app.database import init_db, load_settings, save_settings, upsert_device, get_devices

def test_sanitize_relative_path():
    assert sanitize_relative_path("folder/subfolder/file.txt") == "folder/subfolder/file.txt"
    assert sanitize_relative_path("../../secret.key") == "secret.key"
    assert sanitize_relative_path("C:\\Windows\\System32\\calc.exe") == "Windows/System32/calc.exe"
    assert sanitize_relative_path("/root/test.txt") == "root/test.txt"

def test_checksum_calculation():
    with tempfile.NamedTemporaryFile(delete=False) as tf:
        tf.write(b"LANShare secure test file data")
        tf_name = tf.name
    try:
        sha = calculate_sha256(tf_name)
        assert len(sha) == 64
        # Deterministic sha256 check
        import hashlib
        expected = hashlib.sha256(b"LANShare secure test file data").hexdigest()
        assert sha == expected
    finally:
        os.remove(tf_name)

def test_database_and_settings():
    init_db()
    cfg = load_settings()
    assert cfg.device_name
    assert cfg.device_id
    
    # Update device name
    cfg.device_name = "TestMachine123"
    save_settings(cfg)
    updated = load_settings()
    assert updated.device_name == "TestMachine123"

    # Upsert peer device
    upsert_device("peer-abc", "PeerLaptop", "192.168.1.50", 52521)
    devs = get_devices(online_device_ids=["peer-abc"])
    peer = next((d for d in devs if d["device_id"] == "peer-abc"), None)
    assert peer is not None
    assert peer["is_online"] is True
    assert peer["last_known_ip"] == "192.168.1.50"

    # Test permanent delete & block
    from app.database import delete_device, get_blocked_device_ids, unblock_device
    delete_device("peer-abc")
    blocked = get_blocked_device_ids()
    assert "peer-abc" in blocked
    devs_after = get_devices()
    assert not any(d["device_id"] == "peer-abc" for d in devs_after)

    # Test unblock
    unblock_device("peer-abc")
    assert "peer-abc" not in get_blocked_device_ids()

def test_network_detection():
    ifaces = get_network_interfaces()
    assert isinstance(ifaces, list)
    best = get_best_lan_ip()
    assert "ip_address" in best
    assert "is_up" in best
