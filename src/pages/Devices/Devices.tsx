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
    const ip = manualIp.trim();
    setIsConnecting(true);
    setFeedback(null);
    try {
      const res = await api.connectManual(ip);
      await refreshDevices();
      setManualIp('');
      if (res && res.online) {
        setFeedback(`✓ Connected! ${ip} is ONLINE and ready for Gigabit transfer.`);
      } else {
        setFeedback(`✓ Saved! ${ip} has been added to your devices list and will stay saved permanently. Continual LAN beaconing active.`);
      }
    } catch (e: any) {
      setFeedback(`IP Saved to list. Note: ${e.message}`);
      await refreshDevices();
    } finally {
      setIsConnecting(false);
    }
  };

  const handlePingDevice = async (ip: string) => {
    setIsConnecting(true);
    try {
      const res = await api.connectManual(ip);
      await refreshDevices();
      if (res && res.online) {
        setFeedback(`✓ Device ${ip} is ONLINE!`);
      } else {
        setFeedback(`Ping sent to ${ip}. Waiting for response...`);
      }
    } catch (e: any) {
      setFeedback(`Ping error: ${e.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    try {
      await api.deleteDevice(deviceId);
      await refreshDevices();
      setFeedback('Device removed from your list.');
    } catch (e: any) {
      console.error('Delete device error:', e);
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
    <div className="space-y-6 w-full pb-12">
      {/* Light Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl p-8 bg-white border border-slate-200 shadow-sm text-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100 shadow-xs">
              <Radio className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
              <span>Direct LAN & Auto-Discovery Beacon (Port 52520)</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900">
              LAN Network Devices
            </h2>
            <p className="text-slate-600 text-sm font-medium leading-relaxed">
              Auto-discover peers on the Ethernet network segment or enter an IP once to save it permanently. Saved devices remain available even across restarts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refreshDevices()}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <RefreshCw className="w-4 h-4" /> Scan Network
            </button>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-between gap-3 text-xs font-bold text-indigo-900 shadow-sm">
          <div className="flex items-center gap-2.5">
            <Activity className="w-4 h-4 shrink-0 text-indigo-600" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-indigo-400 hover:text-indigo-700 text-xs font-bold">Dismiss</button>
        </div>
      )}

      {/* Manual IP Connect Bar */}
      <form onSubmit={handleManualConnect} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex gap-4 items-center">
        <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 shadow-xs">
          <Link className="w-5 h-5" />
        </div>
        <input
          type="text"
          placeholder="Enter PC IP Address (e.g. 192.168.1.100 or 169.254.10.20) — will save to list permanently"
          value={manualIp}
          onChange={(e) => setManualIp(e.target.value)}
          className="flex-1 text-xs font-semibold bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
        />
        <button
          type="submit"
          disabled={isConnecting || !manualIp}
          className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20 hover:shadow-lg cursor-pointer transform hover:-translate-y-0.5"
        >
          {isConnecting ? 'Saving & Pinging...' : 'Save & Connect IP'}
        </button>
      </form>

      {/* Devices List */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-indigo-600" />
            Connected & Saved Computers ({devices.length})
          </h3>
          <span className="text-xs text-slate-500 font-medium">Auto-refreshes every 3 seconds</span>
        </div>

        {devices.length === 0 ? (
          <div className="py-14 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl p-6 border border-slate-200">
            <Monitor className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
            <p className="font-bold text-sm text-slate-800">No peer devices active</p>
            <p className="mt-1">Connect the Ethernet cable or type the other computer's IP address above to save it.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {devices.map((dev) => (
              <div key={dev.device_id} className="py-4 flex items-center justify-between hover:bg-slate-50/80 px-4 rounded-2xl transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-xs">
                    <Monitor className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900">{dev.device_name}</span>
                      {dev.is_online ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold">Online</span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">Saved / Offline</span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-slate-500 mt-0.5">{dev.last_known_ip} &bull; Socket Port {dev.transfer_port}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => handlePingDevice(dev.last_known_ip)}
                    title="Ping this device"
                    className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" /> Ping
                  </button>

                  {dev.paired_status === 'trusted' ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-700 font-bold px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl shadow-xs">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> Trusted
                    </span>
                  ) : (
                    <button
                      onClick={() => handleTrust(dev.device_id)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer shadow-xs hover:shadow-sm transition-all"
                    >
                      Trust
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteDevice(dev.device_id)}
                    title="Remove from saved devices list"
                    className="text-slate-400 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
