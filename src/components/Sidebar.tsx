import React from 'react';
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
  Share2
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  isOnline: boolean;
  activeCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setTab, isOnline, activeCount }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'send', label: 'Send Files', icon: Send },
    { id: 'receive', label: 'Receive Files', icon: Download },
    { id: 'devices', label: 'LAN Devices', icon: Monitor },
    { id: 'share', label: 'Share App (EXE)', icon: Share2, shiny: true },
    { id: 'transfers', label: 'Active Streams', icon: Activity, badge: activeCount > 0 ? activeCount : null },
    { id: 'history', label: 'Transfer History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#E6EAF2] flex flex-col justify-between select-none shadow-sm z-20">
      <div>
        {/* Brand Header */}
        <div className="h-20 flex items-center px-6 gap-3.5 border-b border-[#E6EAF2]">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#3157D5] via-[#486EE6] to-[#7B8EF8] flex items-center justify-center text-white shadow-md shadow-[#3157D5]/25">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-black text-lg text-[#20263A] tracking-tight">LANShare</h1>
              <span className="px-1.5 py-0.2 rounded-md bg-[#3157D5]/10 text-[#3157D5] font-extrabold text-[9px]">PRO</span>
            </div>
            <p className="text-[11px] text-[#758096] font-medium -mt-0.5">Offline Gigabit Transfer</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#3157D5] to-[#486EE6] text-white shadow-md shadow-[#3157D5]/25 transform translate-x-1'
                    : 'text-[#758096] hover:bg-[#F5F7FC] hover:text-[#20263A]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#758096]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && item.badge !== undefined && (
                  <span className={`px-2 py-0.5 text-[10px] rounded-full font-black ${
                    isActive ? 'bg-white text-[#3157D5]' : 'bg-[#3157D5] text-white animate-pulse'
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
            {isOnline ? (
              <>
                <div className="w-2.5 h-2.5 rounded-full bg-[#22A06B]" />
                <div className="absolute w-4 h-4 rounded-full bg-[#22A06B]/30 animate-ping" />
              </>
            ) : (
              <div className="w-2.5 h-2.5 rounded-full bg-[#E05252]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[#20263A] truncate">
              {isOnline ? 'Ethernet Active' : 'No LAN Connection'}
            </p>
            <p className="text-[10px] text-[#758096] font-medium truncate">
              {isOnline ? 'Sockets 52520 / 52521' : 'Check Ethernet cable'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
