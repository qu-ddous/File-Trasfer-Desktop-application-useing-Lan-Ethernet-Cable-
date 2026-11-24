import React, { useState } from 'react';
import { 
  Download, 
  FolderOpen, 
  Check, 
  X, 
  ShieldAlert, 
  FileText, 
  HardDrive, 
  Radio, 
  ShieldCheck, 
  Sparkles, 
  Layers 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { formatBytes } from '../../utils/formatters';

export const ReceiveFiles: React.FC = () => {
  const { incomingRequest, setIncomingRequest, refreshTransfers } = useApp();
  const [savePath, setSavePath] = useState<string>('');
  const [isDeciding, setIsDeciding] = useState(false);

  const handleSelectFolder = async () => {
    if ((window as any).electronAPI?.selectFolder) {
      const folder = await (window as any).electronAPI.selectFolder();
      if (folder) setSavePath(folder);
    } else {
      const folder = prompt("Destination folder path on this PC:");
      if (folder) setSavePath(folder);
    }
  };

  const handleAccept = async () => {
    if (!incomingRequest) return;
    setIsDeciding(true);
    try {
      await api.acceptTransfer(
        incomingRequest.transfer_id, 
        savePath || incomingRequest.default_save_path
      );
      setIncomingRequest(null);
      await refreshTransfers();
    } catch (e) {
      console.error("Accept failed", e);
    } finally {
      setIsDeciding(false);
    }
  };

  const handleReject = async () => {
    if (!incomingRequest) return;
    setIsDeciding(true);
    try {
      await api.rejectTransfer(incomingRequest.transfer_id);
      setIncomingRequest(null);
      await refreshTransfers();
    } catch (e) {
      console.error("Reject failed", e);
    } finally {
      setIsDeciding(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl pb-12">
      {/* Light Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl p-8 bg-white border border-slate-200 shadow-sm text-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-100 shadow-xs">
              <Radio className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
              <span>Inbound Transfer Listener (TCP :52521)</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900">
              Receive Mode & Authorization
            </h2>
            <p className="text-slate-600 text-sm font-medium leading-relaxed">
              Accept or decline incoming data streams from connected LAN peers. Select custom save destinations per transfer with guaranteed SHA-256 verification.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-5 py-3 rounded-2xl bg-purple-50 border border-purple-100 text-center shadow-xs">
              <span className="block text-2xl font-black text-purple-800">{incomingRequest ? 1 : 0}</span>
              <span className="text-[11px] font-bold text-purple-600 uppercase">Pending Prompts</span>
            </div>
          </div>
        </div>
      </div>

      {incomingRequest ? (
        <div className="bg-white rounded-3xl border-2 border-[#7C3AED] p-8 shadow-xl shadow-[#7C3AED]/15 animate-fade-in space-y-6">
          <div className="flex items-center gap-4 text-[#7C3AED]">
            <div className="w-12 h-12 rounded-2xl bg-[#7C3AED]/10 flex items-center justify-center shrink-0 shadow-sm">
              <Download className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-[#20263A]">Incoming Transfer Request</h3>
              <p className="text-xs text-[#758096]">Sender: <span className="font-bold text-[#7C3AED]">{incomingRequest.sender_name}</span> ({incomingRequest.peer_ip})</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#F5F7FC] to-purple-50/40 rounded-2xl p-5 border border-[#E6EAF2] space-y-3 shadow-inner">
            <div className="flex justify-between text-xs text-[#758096]">
              <span>Total Items:</span>
              <span className="font-bold text-[#20263A]">{incomingRequest.total_items} items</span>
            </div>
            <div className="flex justify-between text-xs text-[#758096]">
              <span>Total Payload Size:</span>
              <span className="font-bold text-[#20263A]">{formatBytes(incomingRequest.total_bytes)}</span>
            </div>

            <div className="max-h-48 overflow-y-auto mt-3 border-t border-[#E6EAF2] pt-3 divide-y divide-[#E6EAF2]">
              {incomingRequest.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs py-2 text-slate-700">
                  <span className="truncate pr-4 font-mono">{item.relative_path}</span>
                  <span className="shrink-0 font-bold text-[#7C3AED]">{item.is_directory ? 'Directory' : formatBytes(item.size)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Destination Folder Selection */}
          <div>
            <label className="block text-xs font-bold text-[#20263A] mb-2">Save Destination Folder</label>
            <div className="flex gap-3">
              <input
                type="text"
                readOnly
                value={savePath || incomingRequest.default_save_path}
                className="flex-1 px-4 py-3 text-xs font-medium bg-[#F5F7FC] border border-[#E6EAF2] rounded-2xl text-[#20263A]"
              />
              <button
                onClick={handleSelectFolder}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-[#20263A] cursor-pointer shadow-sm hover:shadow-md transition-all"
              >
                <FolderOpen className="w-4 h-4 text-[#7C3AED]" /> Choose Folder
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-2">
            <button
              disabled={isDeciding}
              onClick={handleAccept}
              className="flex-1 flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-gradient-to-r from-[#22A06B] to-[#1b8558] text-white font-bold text-xs shadow-lg shadow-[#22A06B]/25 hover:shadow-xl hover:shadow-[#22A06B]/35 transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <Check className="w-5 h-5" /> Accept & Stream Files
            </button>
            <button
              disabled={isDeciding}
              onClick={handleReject}
              className="flex-1 flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-gradient-to-r from-[#E05252] to-[#c93f3f] text-white font-bold text-xs shadow-lg shadow-[#E05252]/25 hover:shadow-xl hover:shadow-[#E05252]/35 transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <X className="w-5 h-5" /> Reject Request
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#E6EAF2] p-16 text-center shadow-md hover:shadow-lg transition-all">
          <div className="w-16 h-16 rounded-3xl bg-purple-100/70 text-[#7C3AED] flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Download className="w-8 h-8" />
          </div>
          <h3 className="font-extrabold text-lg text-[#20263A]">Socket Listener Active</h3>
          <p className="text-xs text-[#758096] max-w-md mx-auto mt-2 leading-relaxed">
            LANShare TCP listener is active on port 52521. When a connected peer initiates a file transmission, an authorization prompt will appear here for your approval.
          </p>
        </div>
      )}
    </div>
  );
};
