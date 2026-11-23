import pytest
import asyncio
import os
import tempfile
import shutil
from app.discovery import DiscoveryEngine
from app.transfer import TransferEngine
from app.database import init_db

@pytest.mark.asyncio
async def test_full_peer_transfer_loop():
    """
    Spawns two real in-process engines on distinct ports (simulating PC-A and PC-B)
    and executes a full end-to-end file and folder transfer with SHA-256 verification.
    """
    init_db()

    # Create temporary directories for test files
    src_dir = tempfile.mkdtemp(prefix="lanshare_src_")
    dst_dir = tempfile.mkdtemp(prefix="lanshare_dst_")

    try:
        # Create dummy test files and nested folders in source
        file1 = os.path.join(src_dir, "document.txt")
        with open(file1, "wb") as f:
            f.write(b"Hello from LANShare PC-A! " * 1024) # ~26 KB

        sub_folder = os.path.join(src_dir, "nested_folder")
        os.makedirs(sub_folder, exist_ok=True)
        file2 = os.path.join(sub_folder, "nested_data.bin")
        with open(file2, "wb") as f:
            f.write(os.urandom(64 * 1024)) # 64 KB random binary data

        # Setup Receiver Engine (PC-B) on port 52531
        received_events = []
        async def on_b_event(event):
            received_events.append(event)
            if event.get("event") == "incoming_transfer_request":
                # Auto-accept transfer to dst_dir
                tid = event["data"]["transfer_id"]
                engine_b.accept_transfer(tid, save_path=dst_dir)

        engine_b = TransferEngine(
            device_id="pc-b-uuid",
            device_name="Computer-B",
            port=52531,
            broadcast_event_cb=on_b_event
        )
        await engine_b.start()

        # Setup Sender Engine (PC-A) on port 52530
        engine_a = TransferEngine(
            device_id="pc-a-uuid",
            device_name="Computer-A",
            port=52530
        )
        await engine_a.start()

        # Initiate transfer from PC-A to PC-B
        tid = await engine_a.start_send_transfer(
            peer_ip="127.0.0.1",
            peer_port=52531,
            peer_id="pc-b-uuid",
            peer_name="Computer-B",
            file_paths=[file1, sub_folder]
        )

        # Wait for transfer completion
        for _ in range(30):
            await asyncio.sleep(0.2)
            if any(e.get("event") == "transfer_completed" for e in received_events):
                break

        # Verification: Check that files landed intact in dst_dir
        received_doc = os.path.join(dst_dir, "document.txt")
        received_nested = os.path.join(dst_dir, "nested_folder", "nested_data.bin")

        assert os.path.exists(received_doc), "document.txt was not received"
        assert os.path.exists(received_nested), "nested_folder/nested_data.bin was not received"

        # Check content match
        with open(file1, "rb") as f_orig, open(received_doc, "rb") as f_recv:
            assert f_orig.read() == f_recv.read()

        with open(file2, "rb") as f_orig, open(received_nested, "rb") as f_recv:
            assert f_orig.read() == f_recv.read()

        await engine_a.stop()
        await engine_b.stop()

    finally:
        shutil.rmtree(src_dir, ignore_errors=True)
        shutil.rmtree(dst_dir, ignore_errors=True)
