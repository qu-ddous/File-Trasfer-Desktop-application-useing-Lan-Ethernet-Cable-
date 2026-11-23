import React, { useEffect, useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Save, 
  FolderOpen, 
  CheckCircle2 
} from 'lucide-react';
import { api } from '../../services/api';
import { AppSettings } from '../../types';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    api.getSettings().then(setSettings).catch(console.error);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    await api.saveSettings(settings);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  const handlePickDownloadDir = async () => {
    if ((window as any).electronAPI?.selectFolder) {
      const folder = await (window as any).electronAPI.selectFolder();
      if (folder && settings) {
        setSettings({ ...settings, download_path: folder });
      }
    }
  };

  if (!settings) return <div className="text-xs text-[#758096]">Loading settings...</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-[#20263A]">Settings</h2>
        <p className="text-xs text-[#758096]">Configure local device profile, LAN ports, and storage destination</p>
      </div>

      {savedMsg && (
        <div className="p-3 rounded-xl bg-[#22A06B]/10 text-xs font-semibold text-[#22A06B] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Settings saved successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-[#E6EAF2] p-6 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#20263A] mb-1">Local Device Name</label>
          <input
            type="text"
            value={settings.device_name}
            onChange={(e) => setSettings({ ...settings, device_name: e.target.value })}
            className="w-full text-xs px-3 py-2 bg-[#F5F7FC] border border-[#E6EAF2] rounded-xl text-[#20263A]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#20263A] mb-1">Default Download Folder</label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={settings.download_path}
              className="flex-1 text-xs px-3 py-2 bg-[#F5F7FC] border border-[#E6EAF2] rounded-xl text-[#20263A]"
            />
            <button
              type="button"
              onClick={handlePickDownloadDir}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-semibold rounded-xl text-[#20263A] cursor-pointer"
            >
              Browse
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#20263A] mb-1">UDP Discovery Port</label>
            <input
              type="number"
              value={settings.discovery_port}
              onChange={(e) => setSettings({ ...settings, discovery_port: parseInt(e.target.value) || 52520 })}
              className="w-full text-xs px-3 py-2 bg-[#F5F7FC] border border-[#E6EAF2] rounded-xl text-[#20263A]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#20263A] mb-1">TCP Transfer Port</label>
            <input
              type="number"
              value={settings.transfer_port}
              onChange={(e) => setSettings({ ...settings, transfer_port: parseInt(e.target.value) || 52521 })}
              className="w-full text-xs px-3 py-2 bg-[#F5F7FC] border border-[#E6EAF2] rounded-xl text-[#20263A]"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3157D5] hover:bg-[#2545B8] text-white text-xs font-semibold transition-all cursor-pointer shadow-sm"
          >
            <Save className="w-4 h-4" /> Save Preferences
          </button>
        </div>
      </form>
    </div>
  );
};
