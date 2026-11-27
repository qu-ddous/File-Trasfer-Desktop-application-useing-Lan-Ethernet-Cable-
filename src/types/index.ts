export interface PeerDevice {
  device_id: string;
  device_name: string;
  last_known_ip: string;
  transfer_port: number;
  paired_status: 'unpaired' | 'pending' | 'paired' | 'trusted';
  is_online?: boolean;
  last_seen: string;
}

export interface NetworkStatus {
  is_connected: boolean;
  active_interface: string;
  local_ip: string;
  is_ethernet: boolean;
  speed_mbps: number;
  discovered_devices_count: number;
  active_transfers_count: number;
}

export interface TransferSessionInfo {
  transfer_id: string;
  direction: 'send' | 'receive';
  peer_id: string;
  peer_name: string;
  total_bytes: number;
  transferred_bytes: number;
  current_speed?: number;
  current_item?: string;
  status: 'pending' | 'transferring' | 'completed' | 'failed' | 'cancelled' | 'rejected';
  items_count: number;
}

export interface TransferHistoryRecord {
  transfer_id: string;
  direction: 'send' | 'receive';
  peer_device_id: string;
  peer_device_name: string;
  peer_ip: string;
  total_items: number;
  total_bytes: number;
  transferred_bytes: number;
  status: string;
  error_message?: string;
  started_at: string;
  completed_at?: string;
  average_speed: number;
  save_path?: string;
}

export interface AppSettings {
  device_name: string;
  device_id: string;
  download_path: string;
  discovery_port: number;
  transfer_port: number;
  auto_accept_trusted: boolean;
  max_concurrent_transfers: number;
  chunk_size: number;
  rate_limit_mbps: number;
  theme: string;
}

export interface IncomingRequestData {
  transfer_id: string;
  sender_id: string;
  sender_name: string;
  peer_ip: string;
  total_items: number;
  total_bytes: number;
  items: Array<{
    relative_path: string;
    is_directory: boolean;
    size: number;
    checksum?: string;
  }>;
  default_save_path: string;
}

export interface LogEntry {
  id: string;
  time: string;
  level: string;
  logger: string;
  message: string;
}

export interface DiagnosticPingResult {
  success: boolean;
  ip: string;
  port: number;
  rtt_ms?: number;
  device_id?: string;
  device_name?: string;
  message: string;
  error?: string;
}
