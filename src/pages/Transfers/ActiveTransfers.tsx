import React, { useEffect, useState } from 'react';
import { 
  Activity, 
  ArrowUpRight, 
  ArrowDownLeft, 
  X, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { formatBytes, formatSpeed } from '../../utils/formatters';

export const ActiveTransfers: React.FC = () => {
  const { activeTransfers, refreshTransfers } = useApp();

  const handleCancel = async (transferId: string) => {
    try {
      await api.cancelTransfer(transferId);
      await refreshTransfers();
    } catch (e) {
      console.error("Cancel failed", e);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#20263A]">Active Transfers</h2>
        <p className="text-xs text-[#758096]">Real-time byte progress, live link throughput, and chunk streaming</p>
      </div>

      {activeTransfers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E6EAF2] p-12 text-center shadow-xs">
          <Activity className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="font-semibold text-sm text-[#20263A]">No transfers currently active</h3>
          <p className="text-xs text-[#758096] mt-1">Transfers initiated from Send or Receive will appear here in real-time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeTransfers.map((t) => {
            const percent = t.total_bytes > 0 ? Math.min(100, Math.round((t.transferred_bytes / t.total_bytes) * 100)) : 0;
            const isSend = t.direction === 'send';
            return (
              <div key={t.transfer_id} className="bg-white rounded-2xl border border-[#E6EAF2] p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSend ? 'bg-[#3157D5]/10 text-[#3157D5]' : 'bg-[#22A06B]/10 text-[#22A06B]'}`}>
                      {isSend ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#20263A]">{isSend ? 'Sending to' : 'Receiving from'} {t.peer_name}</h4>
                      <p className="text-[11px] text-[#758096]">{t.items_count} item(s) &bull; {formatBytes(t.transferred_bytes)} of {formatBytes(t.total_bytes)}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCancel(t.transfer_id)}
                    className="flex items-center gap-1 text-xs text-[#E05252] hover:bg-[#E05252]/10 px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#F5F7FC] rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-[#3157D5] h-full transition-all duration-300 rounded-full"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs text-[#758096]">
                  <span className="font-semibold text-[#20263A]">{percent}%</span>
                  <span className="capitalize font-medium">{t.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
