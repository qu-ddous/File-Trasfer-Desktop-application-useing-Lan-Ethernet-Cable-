import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Send, 
  Download, 
  Monitor, 
  Activity, 
  History, 
  Settings, 
  HardDrive, 
  Sparkles, 
  Zap,
  Share2,
  Terminal,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

interface SidebarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  isOnline: boolean;
  onlinePeersCount?: number;
  activeCount: number;
  appMode?: 'server' | 'client' | 'full';
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setTab, isOnline, onlinePeersCount = 0, activeCount }) => {
  const { showToast } = useToast();
  const [fixingFirewall, setFixingFirewall] = useState(false);

  const handleFixFirewall = async () => {
    setFixingFirewall(true);
    try {
      await api.fixFirewall();
      showToast('success', 'Windows Firewall Allowed', 'Ports 52520, 52521, and 52522 are allowed in Windows Defender Firewall.');
    } catch (e) {
      showToast('info', 'Firewall Script Started', 'Accept the Windows Administrator UAC prompt to allow sockets.');
    } finally {
      setTimeout(() => setFixingFirewall(false), 2000);
    }
  };
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'from-indigo-700 to-blue-900' },
    { id: 'send', label: 'Send Files', icon: Send, color: 'from-teal-700 to-emerald-900' },
    { id: 'receive', label: 'Receive Files', icon: Download, color: 'from-purple-700 to-violet-900' },
    { id: 'devices', label: 'LAN Devices', icon: Monitor, color: 'from-cyan-700 to-sky-900' },
    { id: 'share', label: 'Share App (EXE)', icon: Share2, color: 'from-rose-700 to-pink-900' },
    { id: 'transfers', label: 'Active Streams', icon: Activity, badge: activeCount > 0 ? activeCount : null, color: 'from-amber-700 to-orange-900' },
    { id: 'history', label: 'Transfer History', icon: History, color: 'from-red-700 to-rose-900' },
    { id: 'console', label: 'Console & Logs', icon: Terminal, color: 'from-slate-800 to-zinc-950' },
    { id: 'settings', label: 'Settings', icon: Settings, color: 'from-fuchsia-700 to-purple-950' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between select-none shadow-sm z-20">
      <div>
        {/* Brand Header */}
        <div className="h-20 flex items-center px-6 gap-3.5 border-b border-slate-200">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-950 flex items-center justify-center text-white icon-shine">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-black text-lg text-slate-900 tracking-tight">WireDrop</h1>
              <span className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] ${
                isOnline ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {isOnline ? 'ONLINE' : 'LAN READY'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium -mt-0.5">
              Direct Gigabit Transfer
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3.5 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20 transform translate-x-1'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white icon-shine shrink-0`}>
                    <Icon className="w-[18px] h-[18px]" />
                  </div>
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && item.badge !== undefined && (
                  <span className={`px-2 py-0.5 text-[10px] rounded-full font-black ${
                    isActive ? 'bg-white text-slate-900' : 'bg-amber-600 text-white animate-pulse'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Network Status Footer Pill */}
      <div className="p-4 border-t border-[#E6EAF2] bg-[#F5F7FC]/60">
        <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-white border border-[#E6EAF2] shadow-xs">
          <div className="relative flex items-center justify-center">
            {onlinePeersCount > 0 ? (
              <>
                <div className="w-2.5 h-2.5 rounded-full bg-[#22A06B]" />
                <div className="absolute w-4 h-4 rounded-full bg-[#22A06B]/30 animate-ping" />
              </>
            ) : isOnline ? (
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            ) : (
              <div className="w-2.5 h-2.5 rounded-full bg-[#E05252]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[#20263A] truncate">
              {onlinePeersCount > 0 ? 'Peer Connected' : isOnline ? 'Cable Ready (No Peer)' : 'Cable Unplugged'}
            </p>
            <p className="text-[10px] text-[#758096] font-medium truncate">
              {onlinePeersCount > 0 ? `${onlinePeersCount} PC online` : isOnline ? 'Waiting for other PC' : 'Check Ethernet cable'}
            </p>
          </div>
        </div>

        <button
          onClick={handleFixFirewall}
          disabled={fixingFirewall}
          className="mt-2.5 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-[11px] font-extrabold shadow-2xs transition-all cursor-pointer"
          title="Allow WireDrop in Windows Defender Firewall"
        >
          {fixingFirewall ? (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
          ) : (
            <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
          )}
          <span>{fixingFirewall ? 'Configuring Firewall...' : 'Fix Windows Firewall'}</span>
        </button>
      </div>
    </aside>
  );
};
