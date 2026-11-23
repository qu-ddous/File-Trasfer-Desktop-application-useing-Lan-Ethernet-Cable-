import React, { useEffect, useState } from 'react';
import { 
  History as HistoryIcon, 
  FolderOpen, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  ArrowUpRight, 
  ArrowDownLeft 
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#20263A]">Transfer History</h2>
          <p className="text-xs text-[#758096]">Persistent local records stored in SQLite database</p>
        </div>
        {history.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#E05252] hover:bg-[#E05252]/10 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear History
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-[#E6EAF2] p-5 shadow-xs">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#758096]">
            No historical transfer records found.
          </div>
        ) : (
          <div className="divide-y divide-[#E6EAF2]">
            {filtered.map((item) => {
              const isSend = item.direction === 'send';
              const isSuccess = item.status === 'completed';
              return (
                <div key={item.transfer_id} className="py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSuccess ? 'bg-[#22A06B]/10 text-[#22A06B]' : 'bg-[#E05252]/10 text-[#E05252]'}`}>
                      {isSuccess ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#20263A]">
                        {isSend ? 'Sent to' : 'Received from'} {item.peer_device_name} ({formatBytes(item.total_bytes)})
                      </p>
                      <p className="text-[11px] text-[#758096]">
                        {new Date(item.started_at).toLocaleString()} &bull; Avg: {formatSpeed(item.average_speed)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded ${
                      isSuccess ? 'bg-[#22A06B]/10 text-[#22A06B]' : 'bg-[#E05252]/10 text-[#E05252]'
                    }`}>
                      {item.status}
                    </span>
                    {item.save_path && (
                      <button
                        onClick={() => handleOpenFolder(item.save_path)}
                        className="text-xs text-[#3157D5] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <FolderOpen className="w-3.5 h-3.5" /> Open
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
