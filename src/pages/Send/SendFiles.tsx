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
  Monitor 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { formatBytes } from '../../utils/formatters';

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
      // In web browser preview mode fallback prompt
      const path = prompt("Enter full file path to send (Electron dialog active in desktop app):");
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
      const path = prompt("Enter full folder path to send:");
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
      setErrorMsg("Please choose a receiver device.");
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
        setSuccessMsg(`Transfer request sent to ${peer.device_name}! Awaiting receiver approval.`);
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#20263A]">Send Files & Folders</h2>
        <p className="text-xs text-[#758096]">Select items to stream directly through the Ethernet cable to a LAN peer</p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-[#E05252]/10 border border-[#E05252]/20 flex items-center gap-3 text-sm text-[#E05252]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-[#22A06B]/10 border border-[#22A06B]/20 flex items-center gap-3 text-sm text-[#22A06B]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: File Selection */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-[#E6EAF2] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-[#20263A]">Selected Items ({selectedPaths.length})</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePickFiles}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3157D5]/10 text-[#3157D5] hover:bg-[#3157D5]/20 text-xs font-semibold transition-all cursor-pointer"
                >
                  <FilePlus className="w-4 h-4" /> Add Files
                </button>
                <button
                  onClick={handlePickFolder}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3157D5]/10 text-[#3157D5] hover:bg-[#3157D5]/20 text-xs font-semibold transition-all cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4" /> Add Folder
                </button>
                {selectedPaths.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-[#E05252] text-xs font-medium cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            {selectedPaths.length === 0 ? (
              <div className="py-12 border-2 border-dashed border-[#E6EAF2] rounded-xl text-center bg-[#F5F7FC]/60">
                <FolderPlus className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-60" />
                <p className="text-sm font-semibold text-[#20263A]">No files or folders selected</p>
                <p className="text-xs text-[#758096] mt-1">
                  Click 'Add Files' or 'Add Folder' to select items from your drive
                </p>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {selectedPaths.map((p, idx) => {
                  const isDir = !p.includes('.') || p.endsWith('\\') || p.endsWith('/');
                  const name = p.split(/[\\/]/).pop() || p;
                  return (
                    <div key={idx} className="py-2.5 flex items-center justify-between hover:bg-[#F5F7FC] px-2 rounded-lg">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isDir ? <Folder className="w-4 h-4 text-[#3157D5] shrink-0" /> : <File className="w-4 h-4 text-slate-500 shrink-0" />}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#20263A] truncate">{name}</p>
                          <p className="text-[11px] text-[#758096] truncate">{p}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-400 hover:text-[#E05252] p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Destination Peer Selection & Action */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E6EAF2] p-5 shadow-xs">
            <h3 className="font-semibold text-sm text-[#20263A] mb-3">Target Receiver</h3>
            {devices.length === 0 ? (
              <div className="text-center py-6 text-xs text-[#758096]">
                No LAN devices detected.<br />Connect another computer to the Ethernet cable.
              </div>
            ) : (
              <div className="space-y-2">
                {devices.map((dev) => (
                  <label
                    key={dev.device_id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedDeviceId === dev.device_id
                        ? 'border-[#3157D5] bg-[#3157D5]/5 shadow-xs'
                        : 'border-[#E6EAF2] hover:bg-[#F5F7FC]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="target_peer"
                      value={dev.device_id}
                      checked={selectedDeviceId === dev.device_id}
                      onChange={() => setSelectedDeviceId(dev.device_id)}
                      className="accent-[#3157D5]"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#20263A] truncate">{dev.device_name}</p>
                      <p className="text-[11px] text-[#758096] truncate">{dev.last_known_ip}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <button
              disabled={isSending || selectedPaths.length === 0 || !selectedDeviceId}
              onClick={handleStartSend}
              className={`w-full mt-5 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm shadow-sm transition-all cursor-pointer ${
                isSending || selectedPaths.length === 0 || !selectedDeviceId
                  ? 'bg-slate-300 cursor-not-allowed shadow-none'
                  : 'bg-[#3157D5] hover:bg-[#2545B8] shadow-[#3157D5]/20'
              }`}
            >
              <Send className="w-4 h-4" />
              {isSending ? 'Initiating Transfer...' : 'Send Files Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
