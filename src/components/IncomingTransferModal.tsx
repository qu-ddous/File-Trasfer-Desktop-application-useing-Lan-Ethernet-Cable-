import React, { useState } from 'react';
import { Download, FolderOpen, Check, X, ShieldAlert, FileText, HardDrive } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { formatBytes } from '../utils/formatters';

export const IncomingTransferModal: React.FC = () => {
  const { incomingRequest, setIncomingRequest, refreshTransfers } = useApp();
  const [savePath, setSavePath] = useState<string>('');
  const [isDeciding, setIsDeciding] = useState(false);

  if (!incomingRequest) return null;

  const handleSelectFolder = async () => {
    if ((window as any).electronAPI?.selectFolder) {
      const folder = await (window as any).electronAPI.selectFolder();
      if (folder) setSavePath(folder);
    } else {
      const folder = prompt("Select destination folder on this PC:", savePath || incomingRequest.default_save_path);
      if (folder) setSavePath(folder);
    }
  };

  const handleAccept = async () => {
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

  const targetPath = savePath || incomingRequest.default_save_path;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-6 text-slate-800">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Download className="w-6 h-6 animate-bounce" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-lg text-slate-900 truncate">
                Incoming File Transfer
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-700 animate-pulse">
                Direct Socket
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium truncate">
              From: <span className="font-bold text-slate-800">{incomingRequest.sender_name}</span> ({incomingRequest.peer_ip})
            </p>
          </div>
        </div>

        {/* Payload Summary Box */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 pb-2 border-b border-slate-200/80">
            <span>Payload: {incomingRequest.total_items} item(s)</span>
            <span className="font-mono font-bold text-blue-600">{formatBytes(incomingRequest.total_bytes)}</span>
          </div>

          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
            {incomingRequest.items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white border border-slate-100 shadow-2xs">
                <div className="flex items-center gap-2 truncate pr-2">
                  <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate text-slate-700 font-medium">{item.relative_path}</span>
                </div>
                <span className="font-mono text-[11px] text-slate-500 shrink-0">
                  {item.is_directory ? 'DIR' : formatBytes(item.size)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Destination Path Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-slate-500" />
            <span>Destination Folder:</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={targetPath}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-600 truncate focus:outline-none"
            />
            <button
              onClick={handleSelectFolder}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Browse</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleReject}
            disabled={isDeciding}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            <span>Decline</span>
          </button>
          <button
            onClick={handleAccept}
            disabled={isDeciding}
            className="flex-2 flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4 text-white" />
            <span>{isDeciding ? 'Starting...' : 'Accept & Download'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
