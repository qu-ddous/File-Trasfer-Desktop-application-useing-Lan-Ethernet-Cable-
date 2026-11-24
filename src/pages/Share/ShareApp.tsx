import React, { useEffect, useState } from 'react';
import { 
  Share2, 
  Copy, 
  Check, 
  Download, 
  Monitor, 
  ExternalLink, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Wifi, 
  FileBox, 
  CheckCircle2, 
  Info 
} from 'lucide-react';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';

export const ShareApp: React.FC = () => {
  const { networkStatus } = useApp();
  const [shareInfo, setShareInfo] = useState({
    share_url: 'http://127.0.0.1:52522/download',
    has_zip: true,
    has_exe: true,
    ip: '127.0.0.1',
    port: 52522
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.getShareInfo().then((data) => {
      if (data && data.share_url) {
        setShareInfo(data);
      }
    });
  }, [networkStatus]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareInfo.share_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-5xl pb-12 animate-fade-in">
      {/* Light Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl p-8 bg-white border border-slate-200 shadow-sm text-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-bold border border-sky-100 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>Zero-Config Peer Bootstrapper</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900">
              Share Application via Ethernet
            </h2>
            <p className="text-slate-600 text-sm font-medium leading-relaxed">
              If the other computer does not have LANShare installed yet, send it directly through the connected Ethernet cable using your built-in local web server.
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

      {/* Main Sharing Guide Card */}
      <div className="bg-white rounded-3xl border border-[#E6EAF2] p-8 shadow-md hover:shadow-lg transition-all space-y-6">
        <div className="flex items-center justify-between border-b border-[#E6EAF2] pb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 flex items-center justify-center text-[#0284C7] shadow-sm">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-[#20263A]">Direct Browser Download Link</h3>
              <p className="text-xs text-[#758096]">Open this link in any browser (Chrome, Edge) on the second computer</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#22A06B]/15 text-[#22A06B] font-bold text-xs shadow-2xs">
              <div className="w-2 h-2 rounded-full bg-[#22A06B] animate-pulse" />
              Server Ready
            </span>
          </div>
        </div>

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
              Connect the Ethernet LAN cable directly between this PC and the other computer.
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
              Download and extract <span className="font-bold text-[#20263A]">LANShare.exe</span>. As soon as it launches, both devices auto-pair!
            </p>
          </div>
        </div>
      </div>

      {/* Package Status Banner */}
      <div className="bg-white rounded-3xl border border-[#E6EAF2] p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileBox className="w-5 h-5 text-[#0284C7]" />
          <div>
            <h4 className="font-bold text-xs text-[#20263A]">Host Package Available on this Machine</h4>
            <p className="text-[11px] text-[#758096]">Bundled self-contained Windows x64 distribution file</p>
          </div>
        </div>

        <span className="text-xs font-bold text-[#22A06B] flex items-center gap-1.5 px-3 py-1 bg-[#22A06B]/10 rounded-full">
          <CheckCircle2 className="w-4 h-4" /> Ready for Web Streaming
        </span>
      </div>
    </div>
  );
};
