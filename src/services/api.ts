const API_BASE = 'http://127.0.0.1:52522/api';

export const api = {
  getNetworkStatus: async () => {
    const res = await fetch(`${API_BASE}/network/status`);
    return res.json();
  },
  getNetworkInterfaces: async () => {
    const res = await fetch(`${API_BASE}/network/interfaces`);
    return res.json();
  },
  getDevices: async () => {
    const res = await fetch(`${API_BASE}/devices`);
    return res.json();
  },
  connectManual: async (ip: string, port: number = 52520) => {
    const res = await fetch(`${API_BASE}/devices/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip, port })
    });
    return res.json();
  },
  pairDevice: async (deviceId: string, action: 'pair' | 'unpair' | 'trust') => {
    const res = await fetch(`${API_BASE}/devices/pair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: deviceId, action })
    });
    return res.json();
  },
  sendFiles: async (payload: {
    peer_ip: string;
    peer_port: number;
    peer_id: string;
    peer_name: string;
    file_paths: string[];
  }) => {
    const res = await fetch(`${API_BASE}/transfers/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  getActiveTransfers: async () => {
    const res = await fetch(`${API_BASE}/transfers`);
    return res.json();
  },
  getTransferDetails: async (transferId: string) => {
    const res = await fetch(`${API_BASE}/transfers/${transferId}`);
    return res.json();
  },
  acceptTransfer: async (transferId: string, savePath?: string) => {
    const res = await fetch(`${API_BASE}/transfers/${transferId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ save_path: savePath })
    });
    return res.json();
  },
  rejectTransfer: async (transferId: string) => {
    const res = await fetch(`${API_BASE}/transfers/${transferId}/reject`, {
      method: 'POST'
    });
    return res.json();
  },
  cancelTransfer: async (transferId: string) => {
    const res = await fetch(`${API_BASE}/transfers/${transferId}/cancel`, {
      method: 'POST'
    });
    return res.json();
  },
  getHistory: async () => {
    const res = await fetch(`${API_BASE}/history`);
    return res.json();
  },
  clearHistory: async () => {
    const res = await fetch(`${API_BASE}/history`, {
      method: 'DELETE'
    });
    return res.json();
  },
  getSettings: async () => {
    const res = await fetch(`${API_BASE}/settings`);
    return res.json();
  },
  saveSettings: async (settings: any) => {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    return res.json();
  }
};
