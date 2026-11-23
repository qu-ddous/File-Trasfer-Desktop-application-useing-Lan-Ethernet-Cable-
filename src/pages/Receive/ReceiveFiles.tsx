import React, { useState } from 'react';
import { 
  Download, 
  FolderOpen, 
  Check, 
  X, 
  ShieldAlert, 
  FileText, 
  HardDrive 
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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#20263A]">Receive Files</h2>
        <p className="text-xs text-[#758096]">Authorize and monitor incoming LAN transfers sent from other computers</p>
      </div>

      {incomingRequest ? (
        <div className="bg-white rounded-2xl border-2 border-[#3157D5] p-6 shadow-md shadow-[#3157D5]/10 animate-fade-in">
          <div className="flex items-center gap-3 text-[#3157D5] mb-4">
            <Download className="w-6 h-6 animate-bounce" />
            <div>
              <h3 className="font-bold text-base text-[#20263A]">Incoming Transfer Request</h3>
              <p className="text-xs text-[#758096]">Sender: <span className="font-semibold text-[#20263A]">{incomingRequest.sender_name}</span> ({incomingRequest.peer_ip})</p>
            </div>
          </div>

          <div className="bg-[#F5F7FC] rounded-xl p-4 my-4 space-y-2">
            <div className="flex justify-between text-xs text-[#758096]">
              <span>Total Items:</span>
              <span className="font-semibold text-[#20263A]">{incomingRequest.total_items} items</span>
            </div>
            <div className="flex justify-between text-xs text-[#758096]">
              <span>Total Size:</span>
              <span className="font-semibold text-[#20263A]">{formatBytes(incomingRequest.total_bytes)}</span>
            </div>
            <div className="max-h-40 overflow-y-auto mt-2 border-t border-[#E6EAF2] pt-2">
              {incomingRequest.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-[11px] py-1 text-slate-600">
                  <span className="truncate pr-4">{item.relative_path}</span>
                  <span>{item.is_directory ? 'Folder' : formatBytes(item.size)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Destination Folder */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-[#20263A] mb-1.5">Save Destination</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={savePath || incomingRequest.default_save_path}
                className="flex-1 px-3 py-2 text-xs bg-[#F5F7FC] border border-[#E6EAF2] rounded-xl text-[#20263A]"
              />
              <button
                onClick={handleSelectFolder}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-[#20263A] cursor-pointer"
              >
                <FolderOpen className="w-4 h-4" /> Change Folder
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              disabled={isDeciding}
              onClick={handleAccept}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#22A06B] hover:bg-[#1b8558] text-white font-semibold text-xs transition-all cursor-pointer shadow-sm"
            >
              <Check className="w-4 h-4" /> Accept & Receive
            </button>
            <button
              disabled={isDeciding}
              onClick={handleReject}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#E05252] hover:bg-[#c93f3f] text-white font-semibold text-xs transition-all cursor-pointer shadow-sm"
            >
              <X className="w-4 h-4" /> Reject Request
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E6EAF2] p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-[#3157D5]/10 text-[#3157D5] flex items-center justify-center mx-auto mb-3">
            <Download className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-[#20263A]">Ready to Receive</h3>
          <p className="text-xs text-[#758096] max-w-sm mx-auto mt-1">
            LANShare TCP listener is active on port 52521. When a connected peer sends you files, an authorization prompt will appear here.
          </p>
        </div>
      )}
    </div>
  );
};
