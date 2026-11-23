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
  Layers 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';

interface SendFilesProps {
  onNavigate: (tab: string) => void;
}

export const SendFiles: React.FC<SendFilesProps> = ({ onNavigate }) => {
  const { devices, refreshTransfers } = useApp();
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
        setSuccessMsg(`Transfer initiated with ${peer.device_name}! Awaiting receiver approval.`);
        setSelectedPaths([]);
        await refreshTransfers();
        setTimeout(() => onNavigate('transfers'), 1200);
      } else {
        setErrorMsg(res.detail || "Failed to initiate transfer.");
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to initiate transfer.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl pb-10">
      <div>
        <h2 className="text-2xl font-black text-[#20263A] tracking-tight flex items-center gap-2">
          <span className="p-2 rounded-xl bg-gradient-to-tr from-[#3157D5] to-[#6B7FEA] text-white shadow-md shadow-[#3157D5]/20">
            <Send className="w-5 h-5" />
          </span>
          Send Files & Directories
        </h2>
        <p className="text-xs text-[#758096] mt-1">Select items to transmit through the direct Ethernet cable at native link speed</p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-[#E05252]/10 border border-[#E05252]/20 flex items-center gap-3 text-xs font-bold text-[#E05252] shadow-sm animate-shake">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-[#22A06B]/10 border border-[#22A06B]/20 flex items-center gap-3 text-xs font-bold text-[#22A06B] shadow-sm animate-bounce">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: File Selection (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl border border-[#E6EAF2] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#3157D5]" />
                <h3 className="font-bold text-sm text-[#20263A]">Selected Items ({selectedPaths.length})</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePickFiles}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3157D5]/10 text-[#3157D5] hover:bg-[#3157D5]/20 text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <FilePlus className="w-4 h-4" /> Add Files
                </button>
                <button
                  onClick={handlePickFolder}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#22A06B]/10 text-[#22A06B] hover:bg-[#22A06B]/20 text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <FolderPlus className="w-4 h-4" /> Add Folder
                </button>
                {selectedPaths.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="p-2 rounded-xl text-slate-400 hover:text-[#E05252] hover:bg-[#E05252]/10 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Selected items container */}
            {selectedPaths.length === 0 ? (
              <div className="py-16 border-2 border-dashed border-[#E6EAF2] rounded-2xl text-center bg-gradient-to-b from-[#F5F7FC]/80 to-white">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#3157D5] flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <FolderPlus className="w-7 h-7" />
                </div>
                <p className="text-sm font-bold text-[#20263A]">Drag & drop or select files to send</p>
                <p className="text-xs text-[#758096] max-w-sm mx-auto mt-1">
                  Supports individual files, multiple files, and recursive folder structures with preserved paths.
                </p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto divide-y divide-[#E6EAF2]">
                {selectedPaths.map((p, idx) => {
                  const isDir = !p.includes('.') || p.endsWith('\\') || p.endsWith('/');
                  const name = p.split(/[\\/]/).pop() || p;
                  return (
                    <div key={idx} className="py-3 flex items-center justify-between hover:bg-[#F5F7FC] px-3 rounded-2xl transition-all">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isDir ? 'bg-amber-100/70 text-[#E6A23C]' : 'bg-blue-100/70 text-[#3157D5]'}`}>
                          {isDir ? <Folder className="w-4 h-4" /> : <File className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#20263A] truncate">{name}</p>
                          <p className="text-[11px] font-mono text-[#758096] truncate">{p}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-400 hover:text-[#E05252] p-1.5 rounded-lg hover:bg-[#E05252]/10 transition-all cursor-pointer"
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

        {/* Right Column: Peer Selection & Transfer Trigger */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-[#E6EAF2] p-6 shadow-sm">
            <h3 className="font-bold text-sm text-[#20263A] mb-3 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-[#3157D5]" />
              Select Destination Peer
            </h3>

            {devices.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#758096] bg-[#F5F7FC] rounded-2xl p-4">
                No LAN computers detected.<br />
                Connect the Ethernet cable to another PC and launch LANShare.
              </div>
            ) : (
              <div className="space-y-2.5">
                {devices.map((dev) => (
                  <label
                    key={dev.device_id}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      selectedDeviceId === dev.device_id
                        ? 'border-[#3157D5] bg-[#3157D5]/5 shadow-sm'
                        : 'border-[#E6EAF2] hover:bg-[#F5F7FC]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="target_peer"
                      value={dev.device_id}
                      checked={selectedDeviceId === dev.device_id}
                      onChange={() => setSelectedDeviceId(dev.device_id)}
                      className="accent-[#3157D5] w-4 h-4"
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
              className={`w-full mt-6 flex items-center justify-center gap-2.5 py-4 rounded-2xl text-white font-bold text-xs transition-all cursor-pointer shadow-lg ${
                isSending || selectedPaths.length === 0 || !selectedDeviceId
                  ? 'bg-slate-300 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-[#3157D5] to-[#486EE6] hover:from-[#2545B8] hover:to-[#3157D5] shadow-[#3157D5]/25 hover:shadow-xl hover:shadow-[#3157D5]/35 transform hover:-translate-y-0.5 active:translate-y-0'
              }`}
            >
              <Send className="w-4 h-4" />
              {isSending ? 'Connecting...' : 'Stream To Peer Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
