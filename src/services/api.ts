const API_BASE = 'http://127.0.0.1:52522/api';

const DEFAULT_SETTINGS = {
  device_name: 'LANShare-PC',
  device_id: 'default-local',
  download_path: 'C:\\Users\\Public\\Downloads\\LANShare',
  discovery_port: 52520,
  transfer_port: 52521,
  auto_accept_trusted: false,
  max_concurrent_transfers: 3,
  chunk_size: 524288,
  rate_limit_mbps: 0,
  theme: 'light'
};

async function safeFetch(url: string, options?: RequestInit, fallback: any = {}) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`Fetch error for ${url}:`, err);
    return fallback;
  }
}

export const api = {
  getNetworkStatus: async () => {
    return safeFetch(`${API_BASE}/network/status`, undefined, {
      is_connected: false,
      active_interface: 'Detecting...',
      local_ip: '127.0.0.1',
      is_ethernet: false,
      speed_mbps: 0,
      discovered_devices_count: 0,
      active_transfers_count: 0
    });
  },
  getNetworkInterfaces: async () => {
    return safeFetch(`${API_BASE}/network/interfaces`, undefined, { interfaces: [], best_lan: null });
  },
  getDevices: async () => {
    return safeFetch(`${API_BASE}/devices`, undefined, { devices: [], online_peers: [] });
  },
  connectManual: async (ip: string, port: number = 52520) => {
    return safeFetch(`${API_BASE}/devices/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip, port })
    }, { status: 'error' });
  },
  deleteDevice: async (deviceId: string) => {
    return safeFetch(`${API_BASE}/devices/${encodeURIComponent(deviceId)}`, {
      method: 'DELETE'
    }, { status: 'error' });
  },
  pairDevice: async (deviceId: string, action: 'pair' | 'unpair' | 'trust') => {
    return safeFetch(`${API_BASE}/devices/pair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: deviceId, action })
    }, { status: 'error' });
  },
  sendFiles: async (payload: {
    peer_ip: string;
    peer_port: number;
    peer_id: string;
    peer_name: string;
    file_paths: string[];
  }) => {
    return safeFetch(`${API_BASE}/transfers/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, { status: 'error' });
  },
  getActiveTransfers: async () => {
    return safeFetch(`${API_BASE}/transfers`, undefined, { active: [] });
  },
  getTransferDetails: async (transferId: string) => {
    return safeFetch(`${API_BASE}/transfers/${transferId}`, undefined, null);
  },
  acceptTransfer: async (transferId: string, savePath?: string) => {
    return safeFetch(`${API_BASE}/transfers/${transferId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ save_path: savePath })
    }, { status: 'error' });
  },
  rejectTransfer: async (transferId: string) => {
    return safeFetch(`${API_BASE}/transfers/${transferId}/reject`, {
      method: 'POST'
    }, { status: 'error' });
  },
  cancelTransfer: async (transferId: string) => {
    return safeFetch(`${API_BASE}/transfers/${transferId}/cancel`, {
      method: 'POST'
    }, { status: 'error' });
  },
  getHistory: async () => {
    return safeFetch(`${API_BASE}/history`, undefined, { history: [] });
  },
  getShareInfo: async () => {
    return safeFetch(`${API_BASE}/share/info`, undefined, {
      share_url: 'http://127.0.0.1:52522/download',
      has_zip: false,
      has_exe: false,
      ip: '127.0.0.1',
      port: 52522
    });
  },
  clearHistory: async () => {
    return safeFetch(`${API_BASE}/history`, {
      method: 'DELETE'
    }, { status: 'history_cleared' });
  },
  getSettings: async () => {
    const cached = localStorage.getItem('lanshare_settings');
    const defaultData = cached ? JSON.parse(cached) : DEFAULT_SETTINGS;
    const res = await safeFetch(`${API_BASE}/settings`, undefined, defaultData);
    if (res && res.device_name) {
      localStorage.setItem('lanshare_settings', JSON.stringify(res));
    }
    return res || defaultData;
  },
  saveSettings: async (settings: any) => {
    localStorage.setItem('lanshare_settings', JSON.stringify(settings));
    return safeFetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    }, { status: 'saved_locally', settings });
  }
};
