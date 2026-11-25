import React from 'react';
import { motion } from 'framer-motion';
import { 
  Monitor, 
  Laptop, 
  HardDrive, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  Radio, 
  FileText, 
  Folder, 
  Activity,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { formatBytes, formatSpeed } from '../utils/formatters';

interface NetworkDataFlowProps {
  mode: 'dashboard' | 'send' | 'receive';
  localDeviceName?: string;
  localIp?: string;
  peerDeviceName?: string;
  peerIp?: string;
  isStreaming?: boolean;
  activeItemName?: string;
  transferredBytes?: number;
  totalBytes?: number;
  currentSpeed?: number; // in bytes per second
  stagedFilesCount?: number;
  stagedTotalSize?: number;
}

export const NetworkDataFlow: React.FC<NetworkDataFlowProps> = ({
  mode,
  localDeviceName = 'This Computer',
  localIp = '127.0.0.1',
  peerDeviceName,
  peerIp,
  isStreaming = false,
  activeItemName,
  transferredBytes = 0,
  totalBytes = 0,
  currentSpeed = 0,
  stagedFilesCount = 0,
  stagedTotalSize = 0
}) => {
  const isSend = mode === 'send';
  const isReceive = mode === 'receive';
  const isDashboard = mode === 'dashboard';

  // Determine Source and Target Nodes based on mode
  const sourceName = isReceive ? (peerDeviceName || 'Remote Peer') : localDeviceName;
  const sourceIp = isReceive ? (peerIp || 'LAN Peer') : localIp;
  const sourceLabel = isReceive ? 'Transmitter Node' : 'Source Computer';

  const targetName = isReceive ? localDeviceName : (peerDeviceName || 'Select Peer PC');
  const targetIp = isReceive ? localIp : (peerIp || 'Target IP');
  const targetLabel = isReceive ? 'WireDrop Storage' : 'Receiver Node';

  const hasPeer = Boolean(peerIp && peerIp !== '127.0.0.1');
  const progressPercent = totalBytes > 0 ? Math.min(Math.round((transferredBytes / totalBytes) * 100), 100) : 0;

  return (
    <div className="relative overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
      {/* Background subtle grid pattern for n8n / node graph feel */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#0F172A 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Top Header of the Flow Canvas */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
            <Zap className="w-4 h-4 fill-blue-600" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <span>Direct Wire Pipeline Visualizer</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                isStreaming 
                  ? 'bg-purple-100 text-purple-700 animate-pulse'
                  : hasPeer
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {isStreaming ? 'STREAMING ACTIVE' : hasPeer ? 'LINK ESTABLISHED' : 'STANDBY'}
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 font-medium -mt-0.5">
              Kernel TCP Socket Pipeline &bull; Port 52521 &bull; 512 KB Chunked Streaming
            </p>
          </div>
        </div>

        {/* Live Telemetry Pill */}
        {isStreaming && (
          <div className="flex items-center gap-3 bg-purple-50 px-3.5 py-1.5 rounded-xl border border-purple-200 text-xs font-mono font-bold text-purple-900 shadow-xs">
            <Activity className="w-4 h-4 text-purple-600 animate-spin" />
            <span>Speed: {formatSpeed(currentSpeed)}</span>
            <span className="text-purple-400">|</span>
            <span>{progressPercent}% Complete</span>
          </div>
        )}
      </div>

      {/* Visual Graph Canvas: Node A -> Animated Pipe -> Node B */}
      <div className="relative z-10 py-6 px-2 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* NODE A (Source) */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className={`relative w-full md:w-64 rounded-2xl p-4.5 border-2 transition-all shadow-md ${
            isStreaming || hasPeer
              ? 'bg-white border-blue-500 shadow-blue-500/10'
              : 'bg-slate-50/70 border-slate-200'
          }`}
        >
          {/* Node Port Handle */}
          <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-xs z-20" />
          
          <div className="flex items-start gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
              isReceive ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
            }`}>
              <Monitor className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                {sourceLabel}
              </span>
              <h4 className="font-extrabold text-sm text-slate-900 truncate" title={sourceName}>
                {sourceName}
              </h4>
              <p className="font-mono text-[11px] text-slate-500 truncate mt-0.5">
                {sourceIp}
              </p>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-medium text-slate-500">
            <span>Protocol: TCP Socket</span>
            <span className="font-bold text-emerald-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Ready
            </span>
          </div>
        </motion.div>

        {/* CONNECTING HIGH-SPEED DATA WIRE (Center Bus) */}
        <div className="relative flex-1 w-full flex flex-col items-center justify-center my-2 md:my-0 px-2">
          
          {/* SVG Animated Transmission Cable */}
          <div className="w-full relative h-12 flex items-center justify-center">
            {/* Base Wire Track */}
            <div className="w-full h-2 rounded-full bg-slate-200/80 overflow-hidden relative shadow-inner">
              {/* Pulsing Ethernet Link Gradient */}
              <div className={`h-full w-full ${
                isStreaming 
                  ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500' 
                  : hasPeer
                  ? 'bg-gradient-to-r from-blue-400 to-emerald-400'
                  : 'bg-slate-300'
              }`} />
            </div>

            {/* Traveling Data Packets Animation */}
            {isStreaming ? (
              <div className="absolute inset-0 flex items-center justify-between pointer-events-none">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      x: ['-50px', '220px'],
                      opacity: [0, 1, 1, 0],
                      scale: [0.8, 1.2, 0.8]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.2,
                      delay: i * 0.22,
                      ease: 'easeInOut'
                    }}
                    className="w-4 h-4 rounded-full bg-white border-2 border-purple-600 shadow-md shadow-purple-500/50 flex items-center justify-center"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                  </motion.div>
                ))}
              </div>
            ) : hasPeer ? (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                  animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="px-3 py-1 rounded-full bg-white border border-emerald-300 text-emerald-700 text-[10px] font-black tracking-wider uppercase shadow-xs"
                >
                  Ethernet Gigabit Link Active (1000 Mbps)
                </motion.div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="px-3 py-0.5 rounded-full bg-white border border-slate-200 text-slate-400 text-[10px] font-bold">
                  Direct RJ-45 Cable
                </span>
              </div>
            )}
          </div>

          {/* Central Transmission Payload Capsule */}
          {isStreaming ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mt-2 w-full max-w-xs bg-slate-900 text-white rounded-2xl p-3 shadow-lg border border-slate-800 text-center space-y-1.5"
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                <span className="truncate pr-2 font-mono">{activeItemName || 'Payload chunk streaming'}</span>
                <span className="text-emerald-400 font-mono">{formatSpeed(currentSpeed)}</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>{formatBytes(transferredBytes)}</span>
                <span>{formatBytes(totalBytes)} ({progressPercent}%)</span>
              </div>
            </motion.div>
          ) : stagedFilesCount > 0 ? (
            <div className="mt-2 px-4 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold flex items-center gap-2 shadow-2xs">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Staged: {stagedFilesCount} item(s) ({formatBytes(stagedTotalSize)})</span>
            </div>
          ) : null}
        </div>

        {/* NODE B (Target) */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className={`relative w-full md:w-64 rounded-2xl p-4.5 border-2 transition-all shadow-md ${
            isStreaming || hasPeer
              ? 'bg-white border-emerald-500 shadow-emerald-500/10'
              : 'bg-slate-50/70 border-slate-200'
          }`}
        >
          {/* Node Port Handle */}
          <div className="hidden md:block absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white shadow-xs z-20" />

          <div className="flex items-start gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
              isReceive ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'
            }`}>
              {isReceive ? <HardDrive className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                {targetLabel}
              </span>
              <h4 className="font-extrabold text-sm text-slate-900 truncate" title={targetName}>
                {targetName}
              </h4>
              <p className="font-mono text-[11px] text-slate-500 truncate mt-0.5">
                {targetIp}
              </p>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-medium text-slate-500">
            <span>Destination: Downloads</span>
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> SHA-256
            </span>
          </div>
        </motion.div>

      </div>
    </div>
  );
};
