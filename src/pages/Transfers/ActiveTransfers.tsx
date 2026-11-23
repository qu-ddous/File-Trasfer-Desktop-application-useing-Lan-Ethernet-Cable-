import React from 'react';
import { 
  Activity, 
  ArrowUpRight, 
  ArrowDownLeft, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  Gauge, 
  Layers, 
  Radio 
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
    <div className="space-y-6 max-w-6xl pb-12">
      {/* Unique Amber-Orange Shiny Header Hero */}
      <div className="relative overflow-hidden rounded-3xl p-8 text-white shadow-xl shadow-[#EA580C]/20 bg-gradient-to-br from-[#C2410C] via-[#EA580C] to-[#F97316] border border-white/20">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-32 -bottom-20 w-80 h-80 bg-[#FBBF24]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold border border-white/25 shadow-sm">
              <Gauge className="w-3.5 h-3.5 text-yellow-200 animate-spin-slow" />
              <span>Real-Time Socket Stream Throughput</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight drop-shadow-sm">
              Active Transfers & Monitoring
            </h2>
            <p className="text-white/90 text-sm font-medium leading-relaxed">
              Track live byte streaming, instant link throughput, and progress bars fed directly by kernel socket buffers over TCP.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-5 py-3 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 text-center shadow-lg">
              <span className="block text-2xl font-black text-white">{activeTransfers.length}</span>
              <span className="text-[11px] font-bold text-white/80 uppercase">In-Flight Streams</span>
            </div>
          </div>
        </div>
      </div>

      {activeTransfers.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E6EAF2] p-16 text-center shadow-md hover:shadow-lg transition-all">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 text-[#EA580C] flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Activity className="w-8 h-8 opacity-70" />
          </div>
          <h3 className="font-extrabold text-lg text-[#20263A]">No streams currently active</h3>
          <p className="text-xs text-[#758096] max-w-md mx-auto mt-2 leading-relaxed">
            Transfers initiated from 'Send Files' or accepted via 'Receive Files' will display here with live byte counters and progress bars.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeTransfers.map((t) => {
            const percent = t.total_bytes > 0 ? Math.min(100, Math.round((t.transferred_bytes / t.total_bytes) * 100)) : 0;
            const isSend = t.direction === 'send';
            return (
              <div key={t.transfer_id} className="bg-white rounded-3xl border border-[#E6EAF2] p-6 shadow-md hover:shadow-lg transition-all space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${isSend ? 'bg-blue-100 text-[#3157D5]' : 'bg-emerald-100 text-[#22A06B]'}`}>
                      {isSend ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownLeft className="w-6 h-6" />}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base text-[#20263A]">{isSend ? 'Sending to' : 'Receiving from'} {t.peer_name}</h4>
                      <p className="text-xs text-[#758096] mt-0.5">{t.items_count} item(s) &bull; <span className="font-mono font-bold text-[#20263A]">{formatBytes(t.transferred_bytes)}</span> of <span className="font-mono">{formatBytes(t.total_bytes)}</span></p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCancel(t.transfer_id)}
                    className="flex items-center gap-1.5 text-xs text-[#E05252] hover:bg-[#E05252]/10 px-4 py-2.5 rounded-2xl font-bold transition-all cursor-pointer shadow-xs hover:shadow-sm"
                  >
                    <X className="w-4 h-4" /> Cancel Stream
                  </button>
                </div>

                {/* Shiny Progress Bar */}
                <div className="w-full bg-[#F5F7FC] rounded-full h-3 overflow-hidden p-0.5 border border-[#E6EAF2] shadow-inner">
                  <div
                    className="bg-gradient-to-r from-[#EA580C] to-[#F97316] h-full transition-all duration-300 rounded-full shadow-sm"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs font-bold text-[#758096]">
                  <span className="text-[#EA580C] text-sm">{percent}% Complete</span>
                  <span className="capitalize px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">{t.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
