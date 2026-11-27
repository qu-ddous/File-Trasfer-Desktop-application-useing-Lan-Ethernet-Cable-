import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Trash2, 
  Copy, 
  Check, 
  ExternalLink, 
  Radio, 
  Wifi, 
  ShieldCheck, 
  AlertTriangle, 
  Bug, 
  Search, 
  ArrowRight,
  Server,
  Activity,
  Network
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { DiagnosticPingResult } from '../../types';

export const ConsolePage: React.FC = () => {
  const { logs, clearLogs, refreshLogs, networkStatus, devices } = useApp();
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'INFO' | 'WARNING' | 'ERROR'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);

  // Ping Diagnostic Tool State
  const defaultTargetIp = devices.length > 0 ? devices[0].last_known_ip : '';
  const [pingIp, setPingIp] = useState(defaultTargetIp);
  const [pingPort, setPingPort] = useState(52521);
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<DiagnosticPingResult | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleTestPing = async () => {
    if (!pingIp.trim()) return;
    setIsPinging(true);
    setPingResult(null);
    try {
      const res = await api.testPing(pingIp.trim(), pingPort);
      setPingResult(res);
    } catch (e: any) {
      setPingResult({
        success: false,
        ip: pingIp,
        port: pingPort,
        error: e.message || 'Unknown error',
        message: `Diagnostic request failed: ${e.message}`
      });
    } finally {
      setIsPinging(false);
    }
  };

  const handleToggleDevTools = () => {
    if ((window as any).electronAPI?.toggleDevTools) {
      (window as any).electronAPI.toggleDevTools();
    } else {
      alert("In web preview mode. When running WireDrop.exe or npm run dev, press F12 or use the desktop app to open Chrome DevTools.");
    }
  };

  const handleCopyLogs = () => {
    const text = logs
      .map((l) => `[${l.time}] [${l.level}] [${l.logger}] ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredLogs = logs.filter((l) => {
    if (filterLevel !== 'ALL' && l.level !== filterLevel) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        l.message.toLowerCase().includes(q) ||
        l.logger.toLowerCase().includes(q) ||
        l.time.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12 w-full">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl p-8 bg-white border border-slate-200 shadow-sm text-slate-800">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <h2 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3.5">
              <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-800 to-zinc-950 text-white flex items-center justify-center icon-shine">
                <Terminal className="w-5 h-5" />
              </span>
              <span>Diagnostics &amp; Live Console</span>
            </h2>
            <p className="text-slate-600 text-sm font-medium leading-relaxed">
              Real-time kernel TCP/UDP socket telemetry, background server logs, peer connectivity handshake testing, and error inspection.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleToggleDevTools}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              <Bug className="w-4 h-4 text-emerald-400" />
              <span>DevTools (F12)</span>
            </button>
            <button
              onClick={handleCopyLogs}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              <span>{copied ? 'Copied!' : 'Copy Logs'}</span>
            </button>
            <button
              onClick={clearLogs}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* Diagnostic Peer Ping & Port Reachability Tool */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Direct Peer Socket Ping Tool</h3>
              <p className="text-xs text-slate-500 font-medium">
                Verify if port 52521 is accessible on the target computer through the Ethernet cable.
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span>Local: {networkStatus?.local_ip || '127.0.0.1'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-6">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Peer Computer IP Address
            </label>
            <input
              type="text"
              placeholder="e.g. 192.168.123.1 or 169.254.x.x"
              value={pingIp}
              onChange={(e) => setPingIp(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>
          <div className="sm:col-span-3">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Socket Port
            </label>
            <input
              type="number"
              value={pingPort}
              onChange={(e) => setPingPort(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>
          <div className="sm:col-span-3 flex items-end">
            <button
              onClick={handleTestPing}
              disabled={isPinging || !pingIp.trim()}
              className="w-full py-2.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Radio className={`w-4 h-4 ${isPinging ? 'animate-spin' : ''}`} />
              <span>{isPinging ? 'Pinging Socket...' : 'Test Peer Socket'}</span>
            </button>
          </div>
        </div>

        {/* Ping Result Banner */}
        {pingResult && (
          <div className={`p-4 rounded-2xl border text-xs font-medium space-y-2 animate-fade-in ${
            pingResult.success 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <div className="flex items-center gap-2 font-bold">
              {pingResult.success ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Socket Connected Successfully! ({pingResult.rtt_ms}ms)</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Socket Connection Failed (Timeout / Blocked)</span>
                </>
              )}
            </div>
            <p className="text-[11px] opacity-90">{pingResult.message}</p>
            {pingResult.device_name && (
              <p className="text-[11px] font-bold">Peer Name: {pingResult.device_name} (ID: {pingResult.device_id})</p>
            )}
            {!pingResult.success && (
              <div className="pt-2 border-t border-rose-200/60 mt-2 space-y-2 text-[11px]">
                <p className="font-bold text-rose-900">
                  💡 How to fix this in 10 seconds:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-rose-800">
                  <li>Make sure WireDrop is open on the other PC (<span className="font-mono font-bold">{pingIp}</span>).</li>
                  <li>Check if <span className="font-mono font-bold">{pingIp}</span> is an Ethernet IP. (If using LAN cable, don't use Wi-Fi IP <span className="font-mono">10.10.x.x</span> — check the Ethernet IP on the other PC's Dashboard!).</li>
                  <li>On the target PC, run <span className="font-mono font-bold">fix-firewall.bat</span> as Administrator, or paste the command below into an Admin PowerShell.</li>
                </ol>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('netsh advfirewall firewall add rule name="WireDrop Sockets" dir=in action=allow protocol=TCP localport=52521 profile=any');
                    alert("Firewall rule command copied! Paste it into Command Prompt or PowerShell (Run as Administrator) on the receiver PC.");
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] cursor-pointer shadow-xs transition-all"
                >
                  Copy Firewall Allow Command
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Terminal & Log Viewer */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
        {/* Terminal Header Bar */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <span className="font-mono text-xs font-bold text-slate-300 ml-2">WireDrop Kernel Stream</span>
            <span className="text-[10px] font-mono text-slate-500">({filteredLogs.length} events)</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter pills */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
              {(['ALL', 'INFO', 'WARNING', 'ERROR'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFilterLevel(lvl)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    filterLevel === lvl
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            {/* Auto scroll toggle */}
            <label className="flex items-center gap-2 text-[11px] font-mono text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-blue-600"
              />
              <span>Auto-scroll</span>
            </label>
          </div>
        </div>

        {/* Terminal Body */}
        <div className="p-6 font-mono text-xs overflow-y-auto max-h-[460px] min-h-[320px] space-y-1.5 bg-slate-900/90 text-slate-300">
          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <Terminal className="w-8 h-8 mx-auto opacity-30" />
              <p>No log records match current filter.</p>
              <p className="text-[10px]">WireDrop background engine is listening on sockets 52520 / 52521.</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isError = log.level === 'ERROR';
              const isWarn = log.level === 'WARNING';
              const isInfo = log.level === 'INFO';

              return (
                <div key={log.id} className="flex items-start gap-2.5 hover:bg-slate-800/50 py-0.5 px-1.5 rounded transition-colors leading-relaxed">
                  <span className="text-slate-500 shrink-0 select-none text-[11px]">{log.time}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-black shrink-0 ${
                    isError ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                    isWarn ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-blue-500/10 text-blue-400'
                  }`}>
                    {log.level}
                  </span>
                  <span className="text-slate-500 text-[11px] shrink-0">[{log.logger}]</span>
                  <span className={`break-all ${
                    isError ? 'text-rose-300 font-semibold' :
                    isWarn ? 'text-amber-300' :
                    'text-slate-200'
                  }`}>
                    {log.message}
                  </span>
                </div>
              );
            })
          )}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
};
