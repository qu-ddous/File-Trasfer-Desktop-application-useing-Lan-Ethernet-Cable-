import React from 'react';
import { 
  Send, 
  Download, 
  Monitor, 
  Activity, 
  Network, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Zap, 
  ShieldCheck 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatBytes } from '../../utils/formatters';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { networkStatus, devices, activeTransfers } = useApp();

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-[#3157D5] via-[#486EE6] to-[#6B7FEA] rounded-2xl p-6 text-white shadow-md shadow-[#3157D5]/15 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/20 text-xs font-medium backdrop-blur-xs mb-2">
              <Zap className="w-3.5 h-3.5" /> High-Speed Offline Transfer
            </div>
            <h2 className="text-2xl font-bold tracking-tight">LANShare Peer-to-Peer</h2>
            <p className="text-white/80 text-sm mt-1 max-w-xl">
              Transfer unlimited files and folders across your local Ethernet cable with zero cloud dependencies, complete privacy, and SHA-256 data integrity.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('send')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#3157D5] font-semibold text-sm shadow-sm hover:bg-slate-50 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" /> Send Files
            </button>
            <button
              onClick={() => onNavigate('receive')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-sm backdrop-blur-xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" /> Receive Mode
            </button>
          </div>
        </div>
      </div>

      {/* Network & Device Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Network Status */}
        <div className="bg-white rounded-xl p-5 border border-[#E6EAF2] shadow-xs">
          <div className="flex items-center justify-between text-[#758096] mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Network Connection</span>
            <Network className="w-4 h-4 text-[#3157D5]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-xl font-bold ${networkStatus?.is_connected ? 'text-[#20263A]' : 'text-[#E05252]'}`}>
              {networkStatus?.is_connected ? 'Connected' : 'Offline'}
            </span>
            {networkStatus?.is_ethernet && (
              <span className="text-xs px-2 py-0.5 rounded-md bg-[#22A06B]/10 text-[#22A06B] font-medium">Ethernet</span>
            )}
          </div>
          <p className="text-xs text-[#758096] mt-1 truncate">
            IP: {networkStatus?.local_ip || 'None'}
          </p>
        </div>

        {/* Card 2: Discovered Peers */}
        <div className="bg-white rounded-xl p-5 border border-[#E6EAF2] shadow-xs">
          <div className="flex items-center justify-between text-[#758096] mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Discovered Devices</span>
            <Monitor className="w-4 h-4 text-[#3157D5]" />
          </div>
          <div className="text-xl font-bold text-[#20263A]">
            {devices.filter(d => d.is_online).length}
          </div>
          <p className="text-xs text-[#758096] mt-1">
            {devices.length} known in network cache
          </p>
        </div>

        {/* Card 3: Active Transfers */}
        <div className="bg-white rounded-xl p-5 border border-[#E6EAF2] shadow-xs">
          <div className="flex items-center justify-between text-[#758096] mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Transfers</span>
            <Activity className="w-4 h-4 text-[#3157D5]" />
          </div>
          <div className="text-xl font-bold text-[#20263A]">
            {activeTransfers.length}
          </div>
          <p className="text-xs text-[#758096] mt-1">
            Running in real-time
          </p>
        </div>

        {/* Card 4: Security Shield */}
        <div className="bg-white rounded-xl p-5 border border-[#E6EAF2] shadow-xs">
          <div className="flex items-center justify-between text-[#758096] mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Data Protection</span>
            <ShieldCheck className="w-4 h-4 text-[#22A06B]" />
          </div>
          <div className="text-xl font-bold text-[#20263A]">
            SHA-256
          </div>
          <p className="text-xs text-[#758096] mt-1">
            Cryptographic Integrity Active
          </p>
        </div>
      </div>

      {/* Discovered Devices Quick Table */}
      <div className="bg-white rounded-2xl border border-[#E6EAF2] p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-[#20263A] text-base">Discovered LAN Devices</h3>
            <p className="text-xs text-[#758096]">Computers ready on the same Ethernet LAN cable</p>
          </div>
          <button
            onClick={() => onNavigate('devices')}
            className="text-xs font-semibold text-[#3157D5] hover:underline cursor-pointer"
          >
            Manage Devices &rarr;
          </button>
        </div>

        {devices.length === 0 ? (
          <div className="py-8 text-center bg-[#F5F7FC] rounded-xl border border-dashed border-[#E6EAF2]">
            <Monitor className="w-8 h-8 text-[#758096] mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-[#20263A]">No other LANShare peers discovered</p>
            <p className="text-xs text-[#758096] max-w-sm mx-auto mt-1">
              Ensure both computers are connected to the same Ethernet cable or switch and have LANShare running.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E6EAF2]">
            {devices.map((dev) => (
              <div key={dev.device_id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${dev.is_online ? 'bg-[#22A06B]' : 'bg-slate-300'}`} />
                  <div>
                    <p className="text-sm font-semibold text-[#20263A]">{dev.device_name}</p>
                    <p className="text-xs text-[#758096]">{dev.last_known_ip}:{dev.transfer_port}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-[#758096] font-medium capitalize">
                    {dev.paired_status}
                  </span>
                  <button
                    onClick={() => onNavigate('send')}
                    className="px-3 py-1.5 rounded-lg bg-[#3157D5] text-white text-xs font-semibold hover:bg-[#2545B8] transition-all cursor-pointer"
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
