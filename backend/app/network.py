import psutil
import socket
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

def get_network_interfaces() -> List[Dict[str, Any]]:
    """
    Enumerates all active and inactive network interfaces, detecting
    Ethernet/LAN adapters, link speed, status, and IP addresses.
    """
    interfaces = []
    stats = psutil.net_if_stats()
    addrs = psutil.net_if_addrs()

    for iface_name, iface_addrs in addrs.items():
        iface_stat = stats.get(iface_name)
        is_up = iface_stat.isup if iface_stat else False
        speed = iface_stat.speed if iface_stat else 0 # In Mbps

        ipv4_list = []
        mac = None
        broadcast = None

        for addr in iface_addrs:
            if addr.family == socket.AF_INET:
                ipv4_list.append(addr.address)
                if addr.broadcast:
                    broadcast = addr.broadcast
            elif getattr(addr, 'family', None) == getattr(psutil, 'AF_LINK', -1) or addr.family == 17:
                mac = addr.address

        # Classify interface type based on common Windows naming
        lower_name = iface_name.lower()
        is_ethernet = ("ethernet" in lower_name or "lan" in lower_name or "eth" in lower_name or "local area connection" in lower_name)
        is_wifi = ("wi-fi" in lower_name or "wifi" in lower_name or "wlan" in lower_name or "wireless" in lower_name)
        is_loopback = ("loopback" in lower_name or "127.0.0.1" in ipv4_list)

        for ip in ipv4_list:
            interfaces.append({
                "interface_name": iface_name,
                "ip_address": ip,
                "broadcast": broadcast or "255.255.255.255",
                "mac_address": mac or "",
                "is_up": is_up,
                "speed_mbps": speed,
                "is_ethernet": is_ethernet,
                "is_wifi": is_wifi,
                "is_loopback": is_loopback
            })

    return interfaces

def get_best_lan_ip() -> Optional[Dict[str, Any]]:
    """
    Picks the best active LAN/Ethernet interface for transfers.
    Prioritizes active physical Ethernet, then Wi-Fi, avoiding loopback and virtual adapters.
    """
    ifaces = get_network_interfaces()
    active_ifaces = [i for i in ifaces if i["is_up"] and not i["is_loopback"] and not i["ip_address"].startswith("127.")]
    
    # 1. Prefer active Ethernet
    for iface in active_ifaces:
        if iface["is_ethernet"]:
            return iface
            
    # 2. Prefer any active non-virtual interface
    for iface in active_ifaces:
        if not ("vEthernet" in iface["interface_name"] or "Virtual" in iface["interface_name"]):
            return iface

    if active_ifaces:
        return active_ifaces[0]

    return {
        "interface_name": "Loopback",
        "ip_address": "127.0.0.1",
        "broadcast": "127.255.255.255",
        "mac_address": "",
        "is_up": True,
        "speed_mbps": 1000,
        "is_ethernet": False,
        "is_wifi": False,
        "is_loopback": True
    }
