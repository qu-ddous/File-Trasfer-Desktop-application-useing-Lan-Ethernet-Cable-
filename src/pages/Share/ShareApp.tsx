import React, { useEffect, useState } from 'react';
import { 
  Share2, 
  Copy, 
  Check, 
  Monitor, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Wifi, 
  FileBox, 
  CheckCircle2, 
  AlertTriangle,
  Flame,
  Terminal,
  ShieldAlert
} from 'lucide-react';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';

export const ShareApp: React.FC = () => {
  const { networkStatus } = useApp();
  const { showToast } = useToast();
  const [shareInfo, setShareInfo] = useState<any>({
    share_url: 'http://127.0.0.1:52522/download',
    ip_valid: false,
    all_ips: [],
    has_zip: true,
    has_exe: false,
    exe_name: null,
    zip_name: 'WireDrop-Portable.zip',
    ip: '127.0.0.1',
    port: 52522,
    firewall_open: false
  });
  const [copied, setCopied] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [isFixingFirewall, setIsFixingFirewall] = useState(false);

  const refreshShareInfo = () => {
    api.getShareInfo().then((data) => {
      if (data && data.share_url) {
        setShareInfo(data);
      }
    });
  };

  useEffect(() => {
    refreshShareInfo();
  }, [networkStatus]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareInfo.share_url);
    setCopied(true);
    showToast('success', 'Download URL Copied!', `Open ${shareInfo.share_url} in Chrome/Edge on the second PC`, 3500);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleFixFirewall = async () => {
    setIsFixingFirewall(true);
    try {
      await api.fixFirewall();
      showToast('info', 'Accept UAC Prompt', 'Click "Yes" on the Windows Administrator prompt to allow Port 52522 & 52521.', 5000);
      setTimeout(() => {
        refreshShareInfo();
        setIsFixingFirewall(false);
      }, 3000);
    } catch (e) {
      showToast('error', 'Firewall Config Failed', 'Please run fix-firewall.bat as Administrator.', 5000);
      setIsFixingFirewall(false);
    }
  };

  const handleCopyFirewallCmd = () => {
    const cmd = `netsh advfirewall firewall add rule name="WireDrop All" dir=in action=allow protocol=TCP localport=52520-52522 profile=any`;
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(true);
    showToast('info', 'Firewall Command Copied!', 'Run in Windows Command Prompt (cmd) as Administrator');
    setTimeout(() => setCopiedCmd(false), 2500);
  };

  return (
    <div className="space-y-6 w-full pb-12 animate-fade-in">
      {/* Light Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl p-8 bg-white border border-slate-200 shadow-sm text-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <h2 className="text-3xl font-black tracking-tight text-slate-900">
              Share WireDrop via Ethernet
            </h2>
            <p className="text-slate-600 text-sm font-medium leading-relaxed">
              If the second computer does not have WireDrop installed yet, send the installer directly through the connected Ethernet cable using your built-in local web server.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-5 py-3 rounded-2xl bg-sky-50 border border-sky-100 text-center shadow-xs">
              <span className="block text-2xl font-black text-sky-800">:52522</span>
              <span className="text-[11px] font-bold text-sky-600 uppercase">HTTP Port</span>
            </div>
          </div>
        </div>
      </div>

      {/* FIREWALL STATUS BANNER */}
      {shareInfo.firewall_open ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-5 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-300 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-emerald-950">Windows Firewall Open (Port 52522 Allowed)</h4>
              <p className="text-xs text-emerald-800">Other PCs on the Ethernet cable can open your download link in Chrome/Edge without timeouts.</p>
            </div>
          </div>
          <span className="px-3 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-bold shrink-0">Ready</span>
        </div>
      ) : (
        <div className="rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-50/90 to-orange-50/90 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-300 text-amber-700 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-amber-950 flex items-center gap-2">
                  Port 52522 Blocked by Windows Firewall (Causes ERR_CONNECTION_TIMED_OUT)
                </h4>
                <p className="text-xs text-amber-800/90 leading-relaxed max-w-2xl">
                  Windows Defender Firewall is currently blocking incoming browser requests on Port 52522. Click <strong>1-Click Allow in Firewall</strong> and accept the Windows prompt so the second PC can download WireDrop!
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button
                onClick={handleFixFirewall}
                disabled={isFixingFirewall}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md shadow-amber-600/25 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                {isFixingFirewall ? 'Waiting for UAC...' : '1-Click Allow in Firewall'}
              </button>

              <button
                onClick={handleCopyFirewallCmd}
                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-white border border-amber-200 text-amber-900 font-bold text-xs hover:bg-amber-50 transition-all cursor-pointer"
              >
                {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Terminal className="w-3.5 h-3.5 text-amber-700" />}
                {copiedCmd ? 'Command Copied' : 'Copy CMD Rule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Sharing Guide Card */}
      <div className="bg-white rounded-3xl border border-[#E6EAF2] p-8 shadow-md hover:shadow-lg transition-all space-y-6">
        <div className="flex items-center justify-between border-b border-[#E6EAF2] pb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 flex items-center justify-center text-[#0284C7] shadow-sm">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-[#20263A]">Direct Browser Download Link</h3>
              <p className="text-xs text-[#758096]">Open this address in Chrome or Edge on the second computer</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#22A06B]/15 text-[#22A06B] font-bold text-xs shadow-2xs">
              <div className="w-2 h-2 rounded-full bg-[#22A06B] animate-pulse" />
              Server Ready
            </span>
          </div>
        </div>

        {!shareInfo.ip_valid && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs text-rose-800 font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>No active Ethernet IP detected yet. Connect the Ethernet cable to another PC to generate your LAN share link.</span>
          </div>
        )}

        {/* Copy Link Bar */}
        <div className="bg-[#F5F7FC] rounded-2xl p-4 border border-[#E6EAF2] flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full flex items-center gap-3 px-3 py-2 bg-white rounded-xl border border-[#E6EAF2] shadow-inner">
            <Wifi className="w-4 h-4 text-[#0284C7] shrink-0" />
            <input
              type="text"
              readOnly
              value={shareInfo.share_url}
              className="flex-1 text-xs font-mono font-bold text-[#20263A] bg-transparent focus:outline-none select-all"
            />
          </div>

          <button
            onClick={handleCopyLink}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-md ${
              copied
                ? 'bg-[#22A06B] text-white shadow-[#22A06B]/25'
                : 'bg-gradient-to-r from-[#0284C7] to-[#0369A1] hover:from-[#0369A1] hover:to-[#0284C7] text-white shadow-[#0284C7]/25 hover:shadow-lg transform hover:-translate-y-0.5'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" /> Link Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Copy Download URL
              </>
            )}
          </button>
        </div>

        {/* Step by step guide */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-white to-[#F5F7FC] border border-[#E6EAF2] shadow-xs hover:shadow-md transition-all space-y-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#3157D5] font-black text-xs flex items-center justify-center shadow-xs">
              1
            </div>
            <h4 className="font-bold text-xs text-[#20263A]">Connect Cable</h4>
            <p className="text-[11px] text-[#758096] leading-relaxed">
              Connect the Ethernet LAN cable directly between this PC and the second computer.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-white to-[#F5F7FC] border border-[#E6EAF2] shadow-xs hover:shadow-md transition-all space-y-2">
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-[#0284C7] font-black text-xs flex items-center justify-center shadow-xs">
              2
            </div>
            <h4 className="font-bold text-xs text-[#20263A]">Open in Browser</h4>
            <p className="text-[11px] text-[#758096] leading-relaxed">
              Open Chrome or Edge on the other PC and enter the URL: <br />
              <span className="font-mono font-bold text-[#0284C7]">{shareInfo.share_url}</span>
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-white to-[#F5F7FC] border border-[#E6EAF2] shadow-xs hover:shadow-md transition-all space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#22A06B] font-black text-xs flex items-center justify-center shadow-xs">
              3
            </div>
            <h4 className="font-bold text-xs text-[#20263A]">Run & Connect</h4>
            <p className="text-[11px] text-[#758096] leading-relaxed">
              Run <span className="font-bold text-[#20263A]">WireDrop Setup</span> on the second PC. Both machines link automatically!
            </p>
          </div>
        </div>
      </div>

      {/* Package Status Banner */}
      <div className="bg-white rounded-3xl border border-[#E6EAF2] p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileBox className="w-5 h-5 text-[#0284C7]" />
          <div>
            <h4 className="font-bold text-xs text-[#20263A]">Host Package Ready for Streaming</h4>
            <p className="text-[11px] text-[#758096]">Bundled self-contained Windows x64 distribution available on port 52522</p>
          </div>
        </div>

        <span className="text-xs font-bold text-[#22A06B] flex items-center gap-1.5 px-3 py-1 bg-[#22A06B]/10 rounded-full">
          <CheckCircle2 className="w-4 h-4" /> Ready for Web Streaming
        </span>
      </div>
    </div>
  );
};
