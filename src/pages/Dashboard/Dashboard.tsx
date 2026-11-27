import React from 'react';
import { 
  Send, 
  Download, 
  Monitor, 
  Activity, 
  Network, 
  ShieldCheck, 
  Zap, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Sparkles, 
  Radio, 
  ChevronRight, 
  Cpu,
  Share2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatSpeed } from '../../utils/formatters';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { networkStatus, devices, activeTransfers } = useApp();
  const activeTransfer = activeTransfers.length > 0 ? activeTransfers[0] : null;
  const onlinePeers = devices.filter(d => d.is_online);
  const isPeerConnected = onlinePeers.length > 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Light Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl p-8 bg-white border border-slate-200 shadow-sm text-slate-800">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <h2 className="text-3xl font-black tracking-tight text-slate-900">
              WireDrop Peer-to-Peer
            </h2>
            <p className="text-slate-600 text-sm font-medium leading-relaxed">
              Ultra-fast offline file and folder streaming directly across your Ethernet network cable.
              Zero cloud latency, end-to-end SHA-256 integrity, and complete hardware bandwidth utilization.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('send')}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-teal-700 to-emerald-800 hover:from-teal-800 hover:to-emerald-900 text-white font-bold text-sm icon-shine transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Send className="w-5 h-5 text-white" />
              <span>Send Files</span>
            </button>
            <button
              onClick={() => onNavigate('receive')}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-700 to-violet-900 hover:from-purple-800 hover:to-violet-950 text-white font-bold text-sm icon-shine transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Download className="w-5 h-5 text-white" />
              <span>Receive Files</span>
            </button>
            <button
              onClick={() => onNavigate('share')}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-700 to-pink-900 hover:from-rose-800 hover:to-pink-950 text-white font-bold text-sm icon-shine transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Share2 className="w-5 h-5 text-white" />
              <span>Share App (EXE)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Colorful Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Real-Time Connection Status */}
        <div className="relative overflow-hidden bg-white rounded-3xl p-5 border border-[#E6EAF2] shadow-sm hover:shadow-md transition-all group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="relative z-10">
            <div className="flex items-center justify-between text-[#758096] mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider">Peer Connection</span>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-700 to-blue-900 flex items-center justify-center text-white icon-shine">
                <Network className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-black ${
                isPeerConnected
                  ? 'text-[#22A06B]'
                  : networkStatus?.is_connected
                  ? 'text-amber-600'
                  : 'text-[#E05252]'
              }`}>
                {isPeerConnected ? 'Connected' : networkStatus?.is_connected ? 'No Peer' : 'Offline'}
              </span>
              {networkStatus?.is_ethernet && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isPeerConnected
                    ? 'bg-[#22A06B]/15 text-[#22A06B]'
                    : networkStatus?.is_connected
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-rose-100 text-rose-700'
                }`}>
                  {isPeerConnected ? 'Ethernet' : networkStatus?.is_connected ? 'Cable Ready' : 'Unplugged'}
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-[#758096] mt-2 truncate">
              {isPeerConnected
                ? `Linked: ${onlinePeers[0].device_name}`
                : networkStatus?.is_connected
                ? `Waiting (${networkStatus?.local_ip || '127.0.0.1'})`
                : 'Connect Ethernet cable'}
            </p>
          </div>
        </div>

        {/* Card 2: Discovered Peers */}
        <div className="relative overflow-hidden bg-white rounded-3xl p-5 border border-[#E6EAF2] shadow-sm hover:shadow-md transition-all group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="relative z-10">
            <div className="flex items-center justify-between text-[#758096] mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider">LAN Peers</span>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-700 to-violet-900 flex items-center justify-center text-white icon-shine">
                <Monitor className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-[#20263A]">
              {onlinePeers.length}
            </div>
            <p className="text-xs font-semibold text-[#758096] mt-2 truncate">
              {onlinePeers.length > 0
                ? `${onlinePeers.length} online & ready`
                : devices.length > 0
                ? `${devices.length} saved (offline)`
                : 'No peers detected'}
            </p>
          </div>
        </div>

        {/* Card 3: Active Transfers */}
        <div className="relative overflow-hidden bg-white rounded-3xl p-5 border border-[#E6EAF2] shadow-sm hover:shadow-md transition-all group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="relative z-10">
            <div className="flex items-center justify-between text-[#758096] mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider">Live Streams</span>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-700 to-teal-900 flex items-center justify-center text-white icon-shine">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-[#20263A]">
              {activeTransfers.length}
            </div>
            <p className="text-xs font-semibold text-[#758096] mt-2 truncate">
              {activeTransfers.length > 0
                ? `Streaming ${activeTransfer?.items_count || 1} item(s) (${activeTransfer?.peer_name || 'peer'})`
                : isPeerConnected
                ? 'Ready to transfer'
                : 'Idle — waiting for peer'}
            </p>
          </div>
        </div>

        {/* Card 4: Real-Time Link Speed */}
        <div className="relative overflow-hidden bg-white rounded-3xl p-5 border border-[#E6EAF2] shadow-sm hover:shadow-md transition-all group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="relative z-10">
            <div className="flex items-center justify-between text-[#758096] mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider">Link Speed</span>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-700 to-orange-900 flex items-center justify-center text-white icon-shine">
                <Zap className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-[#20263A]">
              {activeTransfer && (activeTransfer.current_speed || 0) > 0
                ? formatSpeed(activeTransfer.current_speed || 0)
                : networkStatus?.is_connected
                ? `${networkStatus?.speed_mbps || 1000} Mbps`
                : '0 Mbps'}
            </div>
            <p className="text-xs font-semibold text-[#758096] mt-2 truncate">
              {activeTransfer
                ? 'Live transfer rate'
                : isPeerConnected
                ? 'Ethernet link active'
                : 'No active peer link'}
            </p>
          </div>
        </div>
      </div>

      {/* Discovered LAN Peers Table */}
      <div className="bg-white rounded-3xl border border-[#E6EAF2] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-[#20263A] text-base flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#3157D5] animate-pulse" />
              Connected LAN Computers
            </h3>
            <p className="text-xs text-[#758096]">Computers communicating over UDP broadcast beacons</p>
          </div>
          <button
            onClick={() => onNavigate('devices')}
            className="flex items-center gap-1 text-xs font-bold text-[#3157D5] hover:text-[#2545B8] cursor-pointer"
          >
            <span>View All Devices</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {devices.length === 0 ? (
          <div className="py-10 text-center bg-gradient-to-b from-[#F5F7FC] to-white rounded-2xl border-2 border-dashed border-[#E6EAF2]">
            <Monitor className="w-10 h-10 text-[#758096]/40 mx-auto mb-2" />
            <p className="text-sm font-bold text-[#20263A]">No other WireDrop peers discovered yet</p>
            <p className="text-xs text-[#758096] max-w-sm mx-auto mt-1">
              Connect both PCs with an Ethernet cable and start WireDrop on both machines. They will detect each other automatically.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E6EAF2]">
            {devices.map((dev) => (
              <div key={dev.device_id} className="py-3.5 flex items-center justify-between hover:bg-[#F5F7FC]/70 px-3 rounded-2xl transition-all">
                <div className="flex items-center gap-3.5">
                  <div className={`w-3.5 h-3.5 rounded-full ${dev.is_online ? 'bg-[#22A06B] shadow-sm shadow-[#22A06B]/50 animate-pulse' : 'bg-slate-300'}`} />
                  <div>
                    <p className="text-sm font-bold text-[#20263A]">{dev.device_name}</p>
                    <p className="text-xs font-mono text-[#758096]">{dev.last_known_ip}:{dev.transfer_port}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 text-[#758096] font-bold capitalize">
                    {dev.paired_status}
                  </span>
                  <button
                    onClick={() => onNavigate('send')}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 hover:shadow-md transition-all cursor-pointer"
                  >
                    Send File
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
