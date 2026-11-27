import React, { useEffect, useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Save, 
  FolderOpen, 
  CheckCircle2, 
  Shield, 
  Radio, 
  HardDrive, 
  Cpu, 
  Sliders, 
  Sparkles 
} from 'lucide-react';
import { api } from '../../services/api';
import { AppSettings } from '../../types';
import { useToast } from '../../context/ToastContext';

export const SettingsPage: React.FC = () => {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<AppSettings>({
    device_name: 'WireDrop-PC',
    device_id: 'default-local',
    download_path: 'C:\\Users\\Public\\Downloads\\WireDrop',
    discovery_port: 52520,
    transfer_port: 52521,
    auto_accept_trusted: true,
    max_concurrent_transfers: 3,
    chunk_size: 524288,
    rate_limit_mbps: 0,
    theme: 'light'
  });
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    api.getSettings().then((data) => {
      if (data && data.device_name) {
        setSettings(data);
      }
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.saveSettings(settings);
    setSavedMsg(true);
    showToast('success', 'Settings Saved', `Your device is now broadcasting as "${settings.device_name}" to all LAN peers.`);
    setTimeout(() => setSavedMsg(false), 2500);
  };

  const handlePickDownloadDir = async () => {
    if ((window as any).electronAPI?.selectFolder) {
      const folder = await (window as any).electronAPI.selectFolder();
      if (folder) {
        setSettings({ ...settings, download_path: folder });
      }
    } else {
      const folder = prompt("Destination folder path on this PC:", settings.download_path);
      if (folder) {
        setSettings({ ...settings, download_path: folder });
      }
    }
  };

  return (
    <div className="space-y-6 w-full pb-10">
      {/* Header */}
      <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-fuchsia-700 to-purple-900 text-white flex items-center justify-center icon-shine">
              <SettingsIcon className="w-5 h-5" />
            </span>
            Preferences &amp; Configuration
          </h2>
          <p className="text-xs text-slate-600 font-medium mt-1">Configure your network identity, high-speed sockets, and secure storage destination</p>
        </div>

        {savedMsg && (
          <div className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4" /> Preferences Saved!
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Identity & Profile */}
        <div className="bg-white rounded-3xl p-6 border border-[#E6EAF2] shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-indigo-900 mb-4">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-700 to-blue-900 text-white flex items-center justify-center icon-shine">
              <Cpu className="w-5 h-5" />
            </span>
            Device Profile &amp; Identification
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-[#20263A] mb-1.5">Broadcast Device Name</label>
              <input
                type="text"
                value={settings.device_name}
                onChange={(e) => setSettings({ ...settings, device_name: e.target.value })}
                className="w-full text-xs font-semibold px-4 py-3 bg-[#F5F7FC] border border-[#E6EAF2] rounded-2xl text-[#20263A] focus:outline-none focus:ring-2 focus:ring-[#3157D5]/20 focus:border-[#3157D5]"
                placeholder="e.g. Alienware-Laptop"
              />
              <p className="text-[11px] text-[#758096] mt-1">Other computers on the Ethernet cable will see this device name.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#20263A] mb-1.5">Unique Device UUID</label>
              <input
                type="text"
                readOnly
                value={settings.device_id}
                className="w-full text-xs font-mono px-4 py-3 bg-slate-100 border border-[#E6EAF2] rounded-2xl text-slate-500 cursor-not-allowed select-all"
              />
              <p className="text-[11px] text-[#758096] mt-1">Immutable cryptographic identifier for local network handshake.</p>
            </div>
          </div>
        </div>

        {/* Card 2: Storage Destination */}
        <div className="bg-white rounded-3xl p-6 border border-[#E6EAF2] shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-emerald-900 mb-4">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-700 to-teal-900 text-white flex items-center justify-center icon-shine">
              <HardDrive className="w-5 h-5" />
            </span>
            Storage &amp; Downloads
          </div>

          <div>
            <label className="block text-xs font-bold text-[#20263A] mb-1.5">Default Inbound Save Directory</label>
            <div className="flex gap-3">
              <input
                type="text"
                readOnly
                value={settings.download_path}
                className="flex-1 text-xs font-medium px-4 py-3 bg-[#F5F7FC] border border-[#E6EAF2] rounded-2xl text-[#20263A]"
              />
              <button
                type="button"
                onClick={handlePickDownloadDir}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#3157D5]/10 hover:bg-[#3157D5]/20 text-[#3157D5] font-bold text-xs transition-all cursor-pointer shadow-xs"
              >
                <FolderOpen className="w-4 h-4" /> Browse
              </button>
            </div>
            <p className="text-[11px] text-[#758096] mt-1.5">All verified incoming file transfers land inside this folder.</p>
          </div>
        </div>

        {/* Card 3: Network & Ports */}
        <div className="bg-white rounded-3xl p-6 border border-[#E6EAF2] shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-amber-900 mb-4">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-700 to-orange-900 text-white flex items-center justify-center icon-shine">
              <Radio className="w-5 h-5" />
            </span>
            Socket Ports &amp; Concurrency
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-[#20263A] mb-1.5">UDP Discovery Port</label>
              <input
                type="number"
                value={settings.discovery_port}
                onChange={(e) => setSettings({ ...settings, discovery_port: parseInt(e.target.value) || 52520 })}
                className="w-full text-xs font-semibold px-4 py-3 bg-[#F5F7FC] border border-[#E6EAF2] rounded-2xl text-[#20263A] focus:outline-none focus:ring-2 focus:ring-[#3157D5]/20"
              />
              <p className="text-[11px] text-[#758096] mt-1">Default: 52520</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#20263A] mb-1.5">TCP Transfer Port</label>
              <input
                type="number"
                value={settings.transfer_port}
                onChange={(e) => setSettings({ ...settings, transfer_port: parseInt(e.target.value) || 52521 })}
                className="w-full text-xs font-semibold px-4 py-3 bg-[#F5F7FC] border border-[#E6EAF2] rounded-2xl text-[#20263A] focus:outline-none focus:ring-2 focus:ring-[#3157D5]/20"
              />
              <p className="text-[11px] text-[#758096] mt-1">Default: 52521</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#20263A] mb-1.5">Chunk Buffer Size</label>
              <select
                value={settings.chunk_size}
                onChange={(e) => setSettings({ ...settings, chunk_size: parseInt(e.target.value) || 524288 })}
                className="w-full text-xs font-semibold px-4 py-3 bg-[#F5F7FC] border border-[#E6EAF2] rounded-2xl text-[#20263A] focus:outline-none focus:ring-2 focus:ring-[#3157D5]/20"
              >
                <option value={262144}>256 KB (Low RAM)</option>
                <option value={524288}>512 KB (Recommended)</option>
                <option value={1048576}>1024 KB (1 MB GigE)</option>
              </select>
              <p className="text-[11px] text-[#758096] mt-1">Memory per packet</p>
            </div>
          </div>
        </div>

        {/* Card 4: Security & Automation */}
        <div className="bg-white rounded-3xl p-6 border border-[#E6EAF2] shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-[#E6A23C] mb-4">
            <Shield className="w-4 h-4" /> Security & Approvals
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.auto_accept_trusted}
              onChange={(e) => setSettings({ ...settings, auto_accept_trusted: e.target.checked })}
              className="w-4 h-4 rounded text-[#3157D5] focus:ring-[#3157D5] accent-[#3157D5] cursor-pointer"
            />
            <div>
              <p className="text-xs font-bold text-[#20263A]">Auto-accept transfers from 'Trusted' devices</p>
              <p className="text-[11px] text-[#758096]">Skip manual prompt when receiving from devices you marked as trusted.</p>
            </div>
          </label>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md shadow-blue-500/20 hover:shadow-lg cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Save className="w-4 h-4" /> Save All Preferences
          </button>
        </div>
      </form>
    </div>
  );
};
