import React, { useEffect, useState, createContext, useContext } from 'react';
import { api } from '../services/api';
import { PeerDevice, NetworkStatus, TransferSessionInfo, IncomingRequestData, LogEntry } from '../types';

interface AppContextType {
  networkStatus: NetworkStatus | null;
  devices: PeerDevice[];
  activeTransfers: TransferSessionInfo[];
  incomingRequest: IncomingRequestData | null;
  logs: LogEntry[];
  setIncomingRequest: (req: IncomingRequestData | null) => void;
  refreshNetwork: () => Promise<void>;
  refreshDevices: () => Promise<void>;
  refreshTransfers: () => Promise<void>;
  refreshLogs: () => Promise<void>;
  clearLogs: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(null);
  const [devices, setDevices] = useState<PeerDevice[]>([]);
  const [activeTransfers, setActiveTransfers] = useState<TransferSessionInfo[]>([]);
  const [incomingRequest, setIncomingRequest] = useState<IncomingRequestData | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const refreshNetwork = async () => {
    try {
      const data = await api.getNetworkStatus();
      setNetworkStatus(data);
    } catch (e) {
      console.error('Failed to get network status', e);
    }
  };

  const refreshDevices = async () => {
    try {
      const data = await api.getDevices();
      setDevices(data.devices || []);
    } catch (e) {
      console.error('Failed to get devices', e);
    }
  };

  const refreshTransfers = async () => {
    try {
      const data = await api.getActiveTransfers();
      setActiveTransfers(data.active || []);
    } catch (e) {
      console.error('Failed to get active transfers', e);
    }
  };

  const refreshLogs = async () => {
    try {
      const res = await api.getLogs();
      if (res && res.logs) {
        setLogs(res.logs);
      }
    } catch (e) {
      console.error('Failed to fetch logs', e);
    }
  };

  const clearLogs = async () => {
    try {
      await api.clearLogs();
      setLogs([]);
    } catch (e) {
      console.error('Failed to clear logs', e);
    }
  };

  useEffect(() => {
    refreshNetwork();
    refreshDevices();
    refreshTransfers();
    refreshLogs();

    // Poll every 3 seconds for fallback
    const interval = setInterval(() => {
      refreshNetwork();
      refreshDevices();
      refreshTransfers();
    }, 3000);

    // Setup live WebSocket
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket('ws://127.0.0.1:52522/ws');
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.event === 'incoming_transfer_request') {
            setIncomingRequest(msg.data);
            // Native notification if in desktop electron
            if ((window as any).electronAPI?.showNotification) {
              (window as any).electronAPI.showNotification(
                'Incoming File Transfer',
                `${msg.data.sender_name} wants to send ${msg.data.total_items} item(s)`
              );
            }
          } else if (msg.event === 'incoming_transfer_started' || msg.event === 'transfer_started' || msg.event === 'transfer_progress' || msg.event === 'transfer_completed') {
            refreshTransfers();
            if (msg.event === 'incoming_transfer_started') {
              setIncomingRequest(null);
            }
          } else if (msg.event === 'device_discovered' || msg.event === 'device_lost') {
            refreshDevices();
            refreshNetwork();
          } else if (msg.event === 'log') {
            setLogs((prev) => [...prev.slice(-499), msg.data]);
          }
        } catch (err) {
          console.error('Error parsing WS message', err);
        }
      };
    } catch (err) {
      console.warn('WS not reachable yet');
    }

    return () => {
      clearInterval(interval);
      if (ws) ws.close();
    };
  }, []);

  return (
    <AppContext.Provider
      value={{
        networkStatus,
        devices,
        activeTransfers,
        incomingRequest,
        logs,
        setIncomingRequest,
        refreshNetwork,
        refreshDevices,
        refreshTransfers,
        refreshLogs,
        clearLogs
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
