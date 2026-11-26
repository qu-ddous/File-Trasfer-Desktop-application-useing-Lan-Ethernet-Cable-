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

        # On Windows, direct Ethernet cable (APIPA 169.254.x.x or static IP without internet)
        # often reports isup=False via NDIS even though the adapter is physically linked and operational.
        effective_is_up = is_up or (len(ipv4_list) > 0 and not is_loopback)
        effective_speed = speed if speed > 0 else (1000 if is_ethernet else 100)

        for ip in ipv4_list:
            interfaces.append({
                "interface_name": iface_name,
                "ip_address": ip,
                "broadcast": broadcast or "255.255.255.255",
                "mac_address": mac or "",
                "is_up": effective_is_up,
                "speed_mbps": effective_speed,
                "is_ethernet": is_ethernet,
                "is_wifi": is_wifi,
                "is_loopback": is_loopback
            })

    return interfaces

def get_best_lan_ip() -> Optional[Dict[str, Any]]:
    """
    Picks the physical Ethernet adapter for direct cable transfers.
    Prioritizes dedicated Ethernet cable link exclusively over Wi-Fi.
    """
    ifaces = get_network_interfaces()
    
    # 1. Look for physical Ethernet adapters first
    ethernets = [
        i for i in ifaces 
        if i["is_ethernet"] and not ("virtual" in i["interface_name"].lower() or "vethernet" in i["interface_name"].lower())
    ]
    
    # Check if any physical Ethernet has an assigned IPv4 address (connected)
    connected_ethernets = [e for e in ethernets if e["is_up"] and not e["ip_address"].startswith("127.")]
    if connected_ethernets:
        return connected_ethernets[0]
        
    # If physical Ethernet exists but cable is unplugged, report cable status
    if ethernets:
        eth = ethernets[0]
        return {
            "interface_name": eth["interface_name"],
            "ip_address": "Cable Unplugged",
            "broadcast": "255.255.255.255",
            "mac_address": eth["mac_address"],
            "is_up": False,
            "speed_mbps": 0,
            "is_ethernet": True,
            "is_wifi": False,
            "is_loopback": False
        }
            
    # 2. If no Ethernet adapter hardware exists on PC, check other physical candidates
    candidates = [
        i for i in ifaces 
        if i["is_up"] and not i["is_loopback"] and not i["ip_address"].startswith("127.")
    ]
    if candidates:
        return candidates[0]

    return {
        "interface_name": "Ethernet (No Link)",
        "ip_address": "127.0.0.1",
        "broadcast": "255.255.255.255",
        "mac_address": "",
        "is_up": False,
        "speed_mbps": 0,
        "is_ethernet": True,
        "is_wifi": False,
        "is_loopback": True
    }
