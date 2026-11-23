import React, { useState } from 'react';
import { 
  Monitor, 
  RefreshCw, 
  Plus, 
  Shield, 
  ShieldCheck, 
  Trash2, 
  Link, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';

export const Devices: React.FC = () => {
  const { devices, refreshDevices } = useApp();
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
      setFeedback(`Sent discovery ping to ${manualIp}. Awaiting response...`);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#20263A]">Discovered LAN Devices</h2>
          <p className="text-xs text-[#758096]">Computers communicating over UDP discovery beacon & TCP</p>
        </div>
        <button
          onClick={() => refreshDevices()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#E6EAF2] hover:bg-[#F5F7FC] text-xs font-semibold text-[#20263A] shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-[#3157D5]/10 text-xs text-[#3157D5] font-medium border border-[#3157D5]/20">
          {feedback}
        </div>
      )}

      {/* Manual IP Connect Bar */}
      <form onSubmit={handleManualConnect} className="bg-white rounded-2xl border border-[#E6EAF2] p-4 shadow-xs flex gap-3 items-center">
        <Link className="w-4 h-4 text-[#758096] shrink-0 ml-1" />
        <input
          type="text"
          placeholder="Manual Connect by IP (e.g. 192.168.1.100 if broadcast is blocked)"
          value={manualIp}
          onChange={(e) => setManualIp(e.target.value)}
          className="flex-1 text-xs bg-transparent focus:outline-none text-[#20263A]"
        />
        <button
          type="submit"
          disabled={isConnecting || !manualIp}
          className="px-4 py-2 rounded-xl bg-[#3157D5] hover:bg-[#2545B8] disabled:bg-slate-200 text-white text-xs font-semibold transition-all cursor-pointer"
        >
          {isConnecting ? 'Connecting...' : 'Connect IP'}
        </button>
      </form>

      {/* Devices List */}
      <div className="bg-white rounded-2xl border border-[#E6EAF2] p-5 shadow-xs">
        {devices.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#758096]">
            No peers detected yet. Once another computer on the LAN launches LANShare, it will appear here automatically.
          </div>
        ) : (
          <div className="divide-y divide-[#E6EAF2]">
            {devices.map((dev) => (
              <div key={dev.device_id} className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-[#3157D5]">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#20263A]">{dev.device_name}</span>
                      {dev.is_online ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#22A06B]/10 text-[#22A06B] font-semibold">Online</span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">Offline</span>
                      )}
                    </div>
                    <p className="text-xs text-[#758096]">{dev.last_known_ip} &bull; Port {dev.transfer_port}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {dev.paired_status === 'trusted' ? (
                    <span className="flex items-center gap-1 text-xs text-[#22A06B] font-semibold px-2 py-1 bg-[#22A06B]/10 rounded-lg">
                      <ShieldCheck className="w-3.5 h-3.5" /> Trusted
                    </span>
                  ) : (
                    <button
                      onClick={() => handleTrust(dev.device_id)}
                      className="px-3 py-1.5 rounded-lg border border-[#E6EAF2] hover:bg-[#F5F7FC] text-xs font-semibold text-[#20263A] cursor-pointer"
                    >
                      Trust Device
                    </button>
                  )}
                  {dev.paired_status === 'trusted' && (
                    <button
                      onClick={() => handleUnpair(dev.device_id)}
                      className="text-xs text-slate-400 hover:text-[#E05252] p-1.5 cursor-pointer"
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
