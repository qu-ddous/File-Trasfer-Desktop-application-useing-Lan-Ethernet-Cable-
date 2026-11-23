import React, { useState } from 'react';
import { 
  Monitor, 
  RefreshCw, 
  Link, 
  ShieldCheck, 
  Trash2, 
  Radio, 
  Cpu, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Wifi, 
  Activity 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';

export const Devices: React.FC = () => {
  const { devices, refreshDevices, networkStatus } = useApp();
  const [manualIp, setManualIp] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleManualConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualIp) return;
    setIsConnecting(true);
    setFeedback(null);
    try {
      await api.connectManual(manualIp.trim());
      setFeedback(`Sent discovery ping to ${manualIp}. Listening for heartbeat...`);
      setManualIp('');
      setTimeout(() => refreshDevices(), 1500);
    } catch (e: any) {
      setFeedback(`Connection error: ${e.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleTrust = async (deviceId: string) => {
    await api.pairDevice(deviceId, 'trust');
    await refreshDevices();
  };

  const handleUnpair = async (deviceId: string) => {
    await api.pairDevice(deviceId, 'unpair');
    await refreshDevices();
  };

  return (
    <div className="space-y-6 max-w-6xl pb-12">
      {/* Unique Indigo-Blue Shiny Header Hero */}
      <div className="relative overflow-hidden rounded-3xl p-8 text-white shadow-xl shadow-[#4F46E5]/20 bg-gradient-to-br from-[#3730A3] via-[#4F46E5] to-[#6366F1] border border-white/20">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-32 -bottom-20 w-80 h-80 bg-[#06B6D4]/25 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold border border-white/25 shadow-sm">
              <Radio className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
              <span>UDP Broadcast Beacon (Port 52520)</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight drop-shadow-sm">
              LAN Network Devices
            </h2>
            <p className="text-white/90 text-sm font-medium leading-relaxed">
              Auto-discover peers on the Ethernet network segment. Manage trust status or connect directly by manual IP address when broadcast packets are filtered.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refreshDevices()}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs backdrop-blur-md border border-white/30 transition-all cursor-pointer shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <RefreshCw className="w-4 h-4" /> Scan Network
            </button>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-[#4F46E5]/10 border border-[#4F46E5]/25 flex items-center gap-3 text-xs font-bold text-[#4F46E5] shadow-md shadow-[#4F46E5]/5">
          <Activity className="w-4 h-4 shrink-0 animate-spin" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Manual IP Connect Bar */}
      <form onSubmit={handleManualConnect} className="bg-white rounded-3xl border border-[#E6EAF2] p-5 shadow-md flex gap-4 items-center">
        <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center shrink-0 shadow-sm">
          <Link className="w-5 h-5" />
        </div>
        <input
          type="text"
          placeholder="Manual Connect by IP (e.g. 192.168.1.100 if broadcast is blocked by switch)"
          value={manualIp}
          onChange={(e) => setManualIp(e.target.value)}
          className="flex-1 text-xs font-semibold bg-transparent focus:outline-none text-[#20263A]"
        />
        <button
          type="submit"
          disabled={isConnecting || !manualIp}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:from-[#3730A3] hover:to-[#4F46E5] disabled:bg-slate-300 text-white text-xs font-bold transition-all shadow-md shadow-[#4F46E5]/25 hover:shadow-lg cursor-pointer transform hover:-translate-y-0.5"
        >
          {isConnecting ? 'Pinging IP...' : 'Connect IP'}
        </button>
      </form>

      {/* Devices List */}
      <div className="bg-white rounded-3xl border border-[#E6EAF2] p-6 shadow-md hover:shadow-lg transition-all">
        <h3 className="font-extrabold text-base text-[#20263A] mb-4 flex items-center gap-2">
          <Monitor className="w-5 h-5 text-[#4F46E5]" />
          Discovered & Paired Computers ({devices.length})
        </h3>

        {devices.length === 0 ? (
          <div className="py-14 text-center text-xs text-[#758096] bg-[#F5F7FC] rounded-2xl p-6 shadow-inner">
            <Monitor className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
            <p className="font-bold text-sm text-[#20263A]">No peer devices active</p>
            <p className="mt-1">Connect the Ethernet cable between two computers and ensure LANShare is running on both.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E6EAF2]">
            {devices.map((dev) => (
              <div key={dev.device_id} className="py-4 flex items-center justify-between hover:bg-[#F5F7FC]/70 px-4 rounded-2xl transition-all shadow-2xs">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-[#4F46E5] shadow-sm">
                    <Monitor className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-[#20263A]">{dev.device_name}</span>
                      {dev.is_online ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#22A06B]/15 text-[#22A06B] font-extrabold">Online</span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold">Offline</span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-[#758096] mt-0.5">{dev.last_known_ip} &bull; Port {dev.transfer_port}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {dev.paired_status === 'trusted' ? (
                    <span className="flex items-center gap-1.5 text-xs text-[#22A06B] font-bold px-3 py-1.5 bg-[#22A06B]/10 rounded-xl shadow-xs">
                      <ShieldCheck className="w-4 h-4" /> Trusted
                    </span>
                  ) : (
                    <button
                      onClick={() => handleTrust(dev.device_id)}
                      className="px-4 py-2 rounded-xl border border-[#E6EAF2] hover:bg-slate-50 text-xs font-bold text-[#20263A] cursor-pointer shadow-sm hover:shadow-md transition-all"
                    >
                      Trust Device
                    </button>
                  )}
                  {dev.paired_status === 'trusted' && (
                    <button
                      onClick={() => handleUnpair(dev.device_id)}
                      className="text-slate-400 hover:text-[#E05252] p-2 rounded-xl hover:bg-[#E05252]/10 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
