import React, { useState } from 'react';
import { 
  FolderPlus, 
  FilePlus, 
  Trash2, 
  Send, 
  Folder, 
  File, 
  AlertCircle, 
  CheckCircle2, 
  Monitor, 
  Sparkles, 
  Layers, 
  Zap, 
  ShieldCheck, 
  HardDrive 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { formatBytes } from '../../utils/formatters';
import { NetworkDataFlow } from '../../components/NetworkDataFlow';
import { useToast } from '../../context/ToastContext';

interface SendFilesProps {
  onNavigate: (tab: string) => void;
}

export const SendFiles: React.FC<SendFilesProps> = ({ onNavigate }) => {
  const { devices, refreshTransfers, networkStatus } = useApp();
  const { showToast } = useToast();
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const selectedPeer = devices.find((d) => d.device_id === selectedDeviceId) || (devices.length > 0 ? devices[0] : undefined);

  const handlePickFiles = async () => {
    if ((window as any).electronAPI?.selectFiles) {
      const files: string[] = await (window as any).electronAPI.selectFiles();
      if (files && files.length > 0) {
        setSelectedPaths((prev) => Array.from(new Set([...prev, ...files])));
      }
    } else {
      const path = prompt("Enter file path to send:");
      if (path) setSelectedPaths((prev) => Array.from(new Set([...prev, path])));
    }
  };

  const handlePickFolder = async () => {
    if ((window as any).electronAPI?.selectFolder) {
      const folder: string | null = await (window as any).electronAPI.selectFolder();
      if (folder) {
        setSelectedPaths((prev) => Array.from(new Set([...prev, folder])));
      }
    } else {
      const path = prompt("Enter folder path to send:");
      if (path) setSelectedPaths((prev) => Array.from(new Set([...prev, path])));
    }
  };

  const handleRemoveItem = (index: number) => {
    setSelectedPaths(selectedPaths.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    setSelectedPaths([]);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleStartSend = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (selectedPaths.length === 0) {
      setErrorMsg("Please select at least one file or folder to send.");
      return;
    }

    if (!selectedDeviceId) {
      setErrorMsg("Please choose a target receiver computer.");
      return;
    }

    const peer = devices.find((d) => d.device_id === selectedDeviceId);
    if (!peer) {
      setErrorMsg("Selected peer device is invalid.");
      return;
    }

    setIsSending(true);
    try {
      const res = await api.sendFiles({
        peer_ip: peer.last_known_ip,
        peer_port: peer.transfer_port,
        peer_id: peer.device_id,
        peer_name: peer.device_name,
        file_paths: selectedPaths
      });

      if (res.status === 'started') {
        showToast('success', 'Transfer Initiated', `Streaming payload to ${peer.device_name}`);
        setSuccessMsg(`Transfer initiated with ${peer.device_name}! Awaiting receiver approval.`);
        setSelectedPaths([]);
        await refreshTransfers();
        setTimeout(() => onNavigate('transfers'), 1200);
      } else {
        showToast('error', 'Transfer Failed', res.detail || "Failed to initiate transfer.");
        setErrorMsg(res.detail || "Failed to initiate transfer.");
      }
    } catch (e: any) {
      showToast('error', 'Transfer Error', e.message || "Failed to initiate transfer.");
      setErrorMsg(e.message || "Failed to initiate transfer.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Light Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl p-8 bg-white border border-slate-200 shadow-sm text-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <h2 className="text-3xl font-black tracking-tight text-slate-900">
              Send Files & Directories
            </h2>
            <p className="text-slate-600 text-sm font-medium leading-relaxed">
              Transmit multi-gigabyte files or entire folder trees with preserved folder hierarchy. All transfers stream directly over the Ethernet link with SHA-256 validation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-5 py-3 rounded-2xl bg-teal-50 border border-teal-100 text-center shadow-xs">
              <span className="block text-2xl font-black text-teal-800">{selectedPaths.length}</span>
              <span className="text-[11px] font-bold text-teal-600 uppercase">Selected Items</span>
            </div>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-[#E05252]/10 border border-[#E05252]/25 flex items-center gap-3 text-xs font-bold text-[#E05252] shadow-md shadow-[#E05252]/5">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-[#22A06B]/10 border border-[#22A06B]/25 flex items-center gap-3 text-xs font-bold text-[#22A06B] shadow-md shadow-[#22A06B]/5">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: File Selection */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl border border-[#E6EAF2] p-6 shadow-md hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#0D9488]" />
                <h3 className="font-bold text-sm text-[#20263A]">Staged Payload List</h3>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={handlePickFiles}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#0D9488]/10 text-[#0D9488] hover:bg-[#0D9488]/20 text-xs font-bold transition-all cursor-pointer shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                >
                  <FilePlus className="w-4 h-4" /> Add Files
                </button>
                <button
                  onClick={handlePickFolder}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#3157D5]/10 text-[#3157D5] hover:bg-[#3157D5]/20 text-xs font-bold transition-all cursor-pointer shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                >
                  <FolderPlus className="w-4 h-4" /> Add Folder
                </button>
                {selectedPaths.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="p-2.5 rounded-2xl text-slate-400 hover:text-[#E05252] hover:bg-[#E05252]/10 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {selectedPaths.length === 0 ? (
              <div className="py-16 border-2 border-dashed border-[#E6EAF2] rounded-2xl text-center bg-gradient-to-b from-[#F5F7FC] to-white shadow-inner">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 text-[#0D9488] flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <FolderPlus className="w-7 h-7" />
                </div>
                <p className="text-sm font-bold text-[#20263A]">No items staged for transmission</p>
                <p className="text-xs text-[#758096] max-w-sm mx-auto mt-1">
                  Click 'Add Files' or 'Add Folder' to select items from your drive.
                </p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto divide-y divide-[#E6EAF2]">
                {selectedPaths.map((p, idx) => {
                  const isDir = !p.includes('.') || p.endsWith('\\') || p.endsWith('/');
                  const name = p.split(/[\\/]/).pop() || p;
                  return (
                    <div key={idx} className="py-3 flex items-center justify-between hover:bg-[#F5F7FC] px-3.5 rounded-2xl transition-all shadow-2xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${isDir ? 'bg-amber-100 text-[#E6A23C]' : 'bg-teal-100 text-[#0D9488]'}`}>
                          {isDir ? <Folder className="w-4 h-4" /> : <File className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#20263A] truncate">{name}</p>
                          <p className="text-[11px] font-mono text-[#758096] truncate">{p}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-400 hover:text-[#E05252] p-2 rounded-xl hover:bg-[#E05252]/10 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Peer Selection & Trigger */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-[#E6EAF2] p-6 shadow-md hover:shadow-lg transition-all">
            <h3 className="font-bold text-sm text-[#20263A] mb-3 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-[#0D9488]" />
              Select Target Computer
            </h3>

            {devices.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#758096] bg-[#F5F7FC] rounded-2xl p-4 shadow-inner">
                No LAN computers detected.<br />
                Connect the Ethernet cable to another PC and launch LANShare.
              </div>
            ) : (
              <div className="space-y-2.5">
                {devices.map((dev) => (
                  <label
                    key={dev.device_id}
                    className={`flex items-center gap-3.5 p-3.5 rounded-2xl border cursor-pointer transition-all shadow-sm ${
                      selectedDeviceId === dev.device_id
                        ? 'border-[#0D9488] bg-[#0D9488]/5 ring-2 ring-[#0D9488]/20 shadow-md'
                        : 'border-[#E6EAF2] hover:bg-[#F5F7FC]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="target_peer"
                      value={dev.device_id}
                      checked={selectedDeviceId === dev.device_id}
                      onChange={() => setSelectedDeviceId(dev.device_id)}
                      className="accent-[#0D9488] w-4 h-4"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#20263A] truncate">{dev.device_name}</p>
                      <p className="text-[11px] font-mono text-[#758096] truncate">{dev.last_known_ip}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <button
              disabled={isSending || selectedPaths.length === 0 || !selectedDeviceId}
              onClick={handleStartSend}
              className={`w-full mt-6 flex items-center justify-center gap-2.5 py-4 rounded-2xl text-white font-bold text-xs transition-all cursor-pointer shadow-md ${
                isSending || selectedPaths.length === 0 || !selectedDeviceId
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-teal-600 hover:bg-teal-700 shadow-teal-500/20 hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0'
              }`}
            >
              <Send className="w-4 h-4" />
              {isSending ? 'Initiating Handshake...' : 'Transmit Payload Now'}
            </button>
          </div>
        </div>
      </div>

      {/* Pro Visual Hardware Data Flow Pipeline (Positioned at bottom) */}
      <NetworkDataFlow
        mode="send"
        localIp={networkStatus?.local_ip}
        peerDeviceName={selectedPeer?.device_name}
        peerIp={selectedPeer?.last_known_ip}
        isStreaming={isSending}
        stagedFilesCount={selectedPaths.length}
      />
    </div>
  );
};
