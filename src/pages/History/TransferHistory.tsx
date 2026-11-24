import React, { useEffect, useState } from 'react';
import { 
  History as HistoryIcon, 
  FolderOpen, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Database, 
  Search, 
  Clock 
} from 'lucide-react';
import { api } from '../../services/api';
import { TransferHistoryRecord } from '../../types';
import { formatBytes, formatSpeed } from '../../utils/formatters';

export const TransferHistory: React.FC = () => {
  const [history, setHistory] = useState<TransferHistoryRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const loadHistory = async () => {
    try {
      const data = await api.getHistory();
      setHistory(data.history || []);
    } catch (e) {
      console.error("Failed to load history", e);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleClearHistory = async () => {
    if (confirm("Are you sure you want to clear transfer history records?")) {
      await api.clearHistory();
      await loadHistory();
    }
  };

  const handleOpenFolder = (folderPath?: string) => {
    if (folderPath && (window as any).electronAPI?.openFolder) {
      (window as any).electronAPI.openFolder(folderPath);
    }
  };

  const filtered = history.filter((h) => 
    h.peer_device_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl pb-12">
      {/* Light Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl p-8 bg-white border border-slate-200 shadow-sm text-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-100 shadow-xs">
              <Database className="w-3.5 h-3.5 text-rose-600" />
              <span>SQLite Persistent Audit Log</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900">
              Transfer Logs & History
            </h2>
            <p className="text-slate-600 text-sm font-medium leading-relaxed">
              Permanent record of all completed, received, and cancelled transfers stored locally on your machine.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs border border-rose-200 transition-all cursor-pointer shadow-xs hover:shadow-sm transform hover:-translate-y-0.5"
              >
                <Trash2 className="w-4 h-4 text-rose-600" /> Clear Logs
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white rounded-3xl border border-[#E6EAF2] p-4 shadow-md flex items-center gap-3">
        <Search className="w-5 h-5 text-[#758096] ml-2" />
        <input
          type="text"
          placeholder="Search transfer history by peer computer name or status..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 text-xs font-semibold bg-transparent focus:outline-none text-[#20263A]"
        />
      </div>

      <div className="bg-white rounded-3xl border border-[#E6EAF2] p-6 shadow-md hover:shadow-lg transition-all">
        <h3 className="font-extrabold text-base text-[#20263A] mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#E11D48]" />
          Historical Sessions ({filtered.length})
        </h3>

        {filtered.length === 0 ? (
          <div className="py-14 text-center text-xs text-[#758096] bg-[#F5F7FC] rounded-2xl p-6 shadow-inner">
            <HistoryIcon className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
            <p className="font-bold text-sm text-[#20263A]">No transfer records found</p>
            <p className="mt-1">Completed and verified transfers will be logged here automatically.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E6EAF2]">
            {filtered.map((item) => {
              const isSend = item.direction === 'send';
              const isSuccess = item.status === 'completed';
              return (
                <div key={item.transfer_id} className="py-4 flex items-center justify-between hover:bg-[#F5F7FC]/70 px-4 rounded-2xl transition-all shadow-2xs">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${isSuccess ? 'bg-emerald-100 text-[#22A06B]' : 'bg-rose-100 text-[#E05252]'}`}>
                      {isSuccess ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-[#20263A]">
                        {isSend ? 'Sent to' : 'Received from'} <span className="text-[#3157D5]">{item.peer_device_name}</span> ({formatBytes(item.total_bytes)})
                      </p>
                      <p className="text-[11px] text-[#758096] mt-0.5">
                        {new Date(item.started_at).toLocaleString()} &bull; Avg Speed: <span className="font-mono font-bold text-[#20263A]">{formatSpeed(item.average_speed)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-full shadow-2xs ${
                      isSuccess ? 'bg-[#22A06B]/15 text-[#22A06B]' : 'bg-[#E05252]/15 text-[#E05252]'
                    }`}>
                      {item.status}
                    </span>
                    {item.save_path && (
                      <button
                        onClick={() => handleOpenFolder(item.save_path)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-[#3157D5] flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                      >
                        <FolderOpen className="w-4 h-4" /> Open Folder
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
