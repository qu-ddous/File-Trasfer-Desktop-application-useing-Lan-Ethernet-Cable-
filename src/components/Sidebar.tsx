import React from 'react';
import { 
  LayoutDashboard, 
  Send, 
  Download, 
  Monitor, 
  Activity, 
  History, 
  Settings, 
  Wifi, 
  WifiOff, 
  HardDrive 
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
    { id: 'devices', label: 'Devices', icon: Monitor },
    { id: 'transfers', label: 'Active Transfers', icon: Activity, badge: activeCount > 0 ? activeCount : null },
    { id: 'history', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#E6EAF2] flex flex-col justify-between select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 gap-3 border-b border-[#E6EAF2]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#3157D5] to-[#6B7FEA] flex items-center justify-center text-white shadow-sm shadow-[#3157D5]/30">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-[#20263A] tracking-tight">LANShare</h1>
            <p className="text-xs text-[#758096] -mt-0.5">Offline LAN Transfer</p>
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
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#3157D5] text-white shadow-sm shadow-[#3157D5]/20 font-semibold'
                    : 'text-[#758096] hover:bg-[#F5F7FC] hover:text-[#20263A]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#758096]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && item.badge !== undefined && (
                  <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                    isActive ? 'bg-white text-[#3157D5]' : 'bg-[#3157D5] text-white'
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
      <div className="p-4 border-t border-[#E6EAF2] bg-[#F5F7FC]/50">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white border border-[#E6EAF2] shadow-xs">
          {isOnline ? (
            <div className="w-2.5 h-2.5 rounded-full bg-[#22A06B] animate-pulse" />
          ) : (
            <div className="w-2.5 h-2.5 rounded-full bg-[#E05252]" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#20263A] truncate">
              {isOnline ? 'LAN Connected' : 'No Network'}
            </p>
            <p className="text-[11px] text-[#758096] truncate">
              {isOnline ? 'Ethernet Ready' : 'Cable unplugged'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
