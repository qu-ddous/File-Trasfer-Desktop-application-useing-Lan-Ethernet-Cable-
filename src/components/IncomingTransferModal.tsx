import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FolderOpen, Check, X, FileText, HardDrive, Monitor, Send } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { formatBytes } from '../utils/formatters';

export const IncomingTransferModal: React.FC = () => {
  const { incomingRequest, setIncomingRequest, refreshTransfers } = useApp();
  const { showToast } = useToast();
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
      showToast('success', 'Receiving Files', `Accepting ${incomingRequest.total_items} item(s) from ${incomingRequest.sender_name}`);
      setIncomingRequest(null);
      await refreshTransfers();
    } catch (e: any) {
      showToast('error', 'Accept Failed', e.message || 'Could not accept transfer');
      console.error("Accept failed", e);
    } finally {
      setIsDeciding(false);
    }
  };

  const handleReject = async () => {
    setIsDeciding(true);
    try {
      await api.rejectTransfer(incomingRequest.transfer_id);
      showToast('info', 'Transfer Rejected', `Declined files from ${incomingRequest.sender_name}`);
      setIncomingRequest(null);
      await refreshTransfers();
    } catch (e: any) {
      showToast('error', 'Reject Failed', e.message || 'Could not reject transfer');
      console.error("Reject failed", e);
    } finally {
      setIsDeciding(false);
    }
  };

  const targetPath = savePath || incomingRequest.default_save_path;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.88, y: 24, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden text-slate-800"
        >
          {/* Lottie-Style Animated Header Illustration Box */}
          <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-500 p-6 text-white overflow-hidden">
            {/* Ambient pulsing radar rings */}
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.25, 0.05, 0.25] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white/20 pointer-events-none"
            />
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.05, 0.2] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute -left-10 -bottom-10 w-36 h-36 rounded-full bg-white/15 pointer-events-none"
            />

            {/* Animated PC-to-PC Flying File Scene */}
            <div className="relative z-10 flex items-center justify-center gap-6 py-2 mb-3">
              {/* Sender PC */}
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="flex flex-col items-center gap-1"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg">
                  <Monitor className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100 max-w-[90px] truncate">
                  {incomingRequest.sender_name}
                </span>
              </motion.div>

              {/* Animated Flying File Packet Track */}
              <div className="relative w-28 h-8 flex items-center justify-center">
                <div className="w-full h-1 rounded-full bg-white/25 overflow-hidden">
                  <motion.div
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
                    className="w-1/2 h-full bg-gradient-to-r from-transparent via-white to-transparent"
                  />
                </div>
                <motion.div
                  animate={{ x: [-36, 36], y: [0, -8, 0], scale: [0.85, 1.1, 0.85], opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute w-7 h-7 rounded-xl bg-white text-blue-600 shadow-lg flex items-center justify-center"
                >
                  <Send className="w-3.5 h-3.5" />
                </motion.div>
              </div>

              {/* Receiver PC (This PC) */}
              <motion.div
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className="flex flex-col items-center gap-1"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-400/30 backdrop-blur-sm border border-emerald-200/50 flex items-center justify-center shadow-lg">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">
                  This PC
                </span>
              </motion.div>
            </div>

            {/* Clear Prompt Message */}
            <div className="relative z-10 text-center space-y-1">
              <h3 className="font-black text-lg tracking-tight text-white">
                {incomingRequest.sender_name} sent you {incomingRequest.total_items} file(s)
              </h3>
              <p className="text-xs text-blue-100 font-medium">
                Do you want to <span className="font-bold text-white underline decoration-emerald-300">Receive</span> or <span className="font-bold text-white underline decoration-rose-300">Reject</span> this transfer? ({incomingRequest.peer_ip})
              </p>
            </div>
          </div>

          {/* Form Body */}
          <div className="p-6 space-y-5">
            {/* Payload Summary Box */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 pb-2 border-b border-slate-200/80">
                <span>Files Included ({incomingRequest.total_items})</span>
                <span className="font-mono font-extrabold text-blue-600">{formatBytes(incomingRequest.total_bytes)}</span>
              </div>

              <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                {incomingRequest.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-white border border-slate-100 shadow-2xs">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="truncate text-slate-700 font-semibold">{item.relative_path}</span>
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
                <span>Save To Folder:</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={targetPath}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-600 truncate focus:outline-none"
                />
                <button
                  onClick={handleSelectFolder}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Browse</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleReject}
                disabled={isDeciding}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                <span>Reject</span>
              </button>
              <button
                onClick={handleAccept}
                disabled={isDeciding}
                className="flex-[2] flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4 text-white" />
                <span>{isDeciding ? 'Starting...' : 'Receive Files'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
