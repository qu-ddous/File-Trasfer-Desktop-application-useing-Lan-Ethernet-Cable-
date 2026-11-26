import React from 'react';
import { motion } from 'framer-motion';
import { 
  Monitor, 
  HardDrive, 
  Zap, 
  Radio, 
  FileText, 
  Layers, 
  ShieldCheck, 
  Cpu, 
  ArrowRight,
  Activity,
  CheckCircle2,
  AlertCircle,
  FolderOpen
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
  currentSpeed?: number;
  stagedFilesCount?: number;
  stagedTotalSize?: number;
}

export const NetworkDataFlow: React.FC<NetworkDataFlowProps> = ({
  mode,
  localDeviceName = 'This PC',
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
  
  const isConnected = Boolean(localIp && localIp !== '127.0.0.1' && !localIp.includes('Unplugged'));
  const hasPeer = Boolean(peerIp && peerIp !== '127.0.0.1' && !peerIp.includes('Target'));

  const sourceName = isReceive ? (peerDeviceName || 'Connected LAN Peer') : localDeviceName;
  const sourceIp = isReceive ? (peerIp || 'Remote IP') : localIp;
  const targetName = isReceive ? localDeviceName : (peerDeviceName || 'Target Computer');
  const targetIp = isReceive ? localIp : (peerIp || 'Target IP');

  const progressPercent = totalBytes > 0 ? Math.min(Math.round((transferredBytes / totalBytes) * 100), 100) : 0;
  const displaySpeed = currentSpeed > 0 ? formatSpeed(currentSpeed) : '1000 Mbps Ready';

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl p-7 text-white select-none">
      
      {/* Background High-Tech Schematic Grid & Glowing Ambient Lights */}
      <div 
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#38BDF8 1px, transparent 1px), linear-gradient(to right, #1E293B 1px, transparent 1px), linear-gradient(to bottom, #1E293B 1px, transparent 1px)',
          backgroundSize: '28px 28px, 112px 112px, 112px 112px'
        }}
      />
      <div className="absolute top-0 left-1/4 w-96 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Panel */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-sm font-black tracking-wider uppercase text-slate-100 flex items-center gap-2">
                Ethernet Wire Gigabit Conduit
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide ${
                isStreaming
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-pulse'
                  : hasPeer
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {isStreaming ? '⚡ TRANSMITTING DATA' : hasPeer ? 'LINK SATURATED (1000M)' : 'READY FOR TRANSFER'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Zero-Router Direct Hardware Socket &bull; Native Kernel Framing &bull; SHA-256 Validated
            </p>
          </div>
        </div>

        {/* Live Speed & Wire Spec Pill */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl px-4 py-2 flex items-center gap-3 shadow-inner">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-mono font-extrabold text-emerald-400">
                {isStreaming ? displaySpeed : 'Link: 1000 Mbps'}
              </span>
            </div>
            <span className="text-slate-600">|</span>
            <span className="text-[11px] font-mono text-slate-300 font-bold">
              Buffer: 1 MB Sockets
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Node Graph Arena */}
      <div className="relative z-10 py-8 px-2 flex flex-col lg:flex-row items-center justify-between gap-8">
        
        {/* NODE 1: SOURCE TERMINAL */}
        <motion.div 
          whileHover={{ y: -3 }}
          className="relative w-full lg:w-72 bg-slate-800/80 hover:bg-slate-800 border-2 border-slate-700 hover:border-blue-500 rounded-3xl p-5 transition-all shadow-xl backdrop-blur-sm"
        >
          {/* Header with Port LEDs */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/70">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/80 animate-pulse" />
              <span className="text-[10px] font-mono font-extrabold text-slate-400 uppercase tracking-widest">
                RJ-45 Port 1
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {isReceive ? 'RECEIVER' : 'TRANSMITTER'}
            </span>
          </div>

          {/* Machine Info */}
          <div className="flex items-center gap-3.5 mt-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <Monitor className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Source Computer
              </span>
              <h4 className="font-extrabold text-sm text-white truncate" title={sourceName}>
                {sourceName}
              </h4>
              <p className="text-xs font-mono text-blue-400 truncate mt-0.5">
                {sourceIp}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Protocol: TCP/IP</span>
            <span className="text-emerald-400 font-bold">Port 52521</span>
          </div>

          {/* Terminal Cable Snap Port (Right side) */}
          <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg bg-slate-900 border-2 border-blue-500 shadow-lg flex items-center justify-center z-20">
            <div className="w-2 h-2 rounded-xs bg-blue-400 animate-pulse" />
          </div>
        </motion.div>

        {/* CENTER CONDUIT: HIGH-SPEED GLOWING ETHERNET BEAM */}
        <div className="relative flex-1 w-full flex flex-col items-center justify-center my-4 lg:my-0 px-2">
          
          {/* Main Track Cable with Neon Core */}
          <div className="w-full relative h-16 flex items-center justify-center">
            
            {/* Outer Braided Cable Sleeve */}
            <div className="w-full h-4 rounded-full bg-slate-800 border border-slate-700 shadow-inner overflow-hidden relative">
              {/* Inner Luminous Energy Plasma */}
              <div className={`h-full w-full ${
                isStreaming
                  ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-400 animate-pulse'
                  : hasPeer
                  ? 'bg-gradient-to-r from-blue-600 to-emerald-500 opacity-60'
                  : 'bg-slate-700 opacity-40'
              }`} />
            </div>

            {/* Glowing Traveling Particles along the Wire */}
            {isStreaming ? (
              <div className="absolute inset-0 flex items-center justify-between pointer-events-none">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      x: ['-40px', '280px'],
                      scale: [0.8, 1.3, 0.8],
                      opacity: [0, 1, 1, 0]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.1,
                      delay: i * 0.18,
                      ease: 'easeInOut'
                    }}
                    className="w-5 h-5 rounded-full bg-white border-2 border-purple-400 shadow-lg shadow-purple-500/80 flex items-center justify-center"
                  >
                    <div className="w-2 h-2 rounded-full bg-purple-600" />
                  </motion.div>
                ))}
              </div>
            ) : hasPeer ? (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div 
                  animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
                  transition={{ repeat: Infinity, duration: 2.5 }}
                  className="px-4 py-1 rounded-full bg-slate-900 border border-emerald-500/50 text-emerald-400 text-[10px] font-mono font-black tracking-widest uppercase shadow-md shadow-emerald-500/20"
                >
                  ⚡ Direct Cat6/7 Gigabit Link Ready
                </motion.div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700 text-slate-400 text-[10px] font-mono font-bold tracking-wider uppercase">
                  RJ-45 Physical Cable Connection
                </span>
              </div>
            )}
          </div>

          {/* Central Telemetry Bridge HUD */}
          {isStreaming ? (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mt-2 w-full max-w-sm bg-slate-950/90 border border-purple-500/40 rounded-2xl p-4 shadow-2xl space-y-2 text-center"
            >
              <div className="flex items-center justify-between text-xs font-mono font-bold">
                <span className="truncate pr-2 text-purple-300 font-extrabold flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                  {activeItemName || 'Streaming Payload Chunks'}
                </span>
                <span className="text-emerald-400 font-black text-sm">{formatSpeed(currentSpeed)}</span>
              </div>

              {/* Progress Track */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden p-0.5">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pt-0.5">
                <span>{formatBytes(transferredBytes)} transferred</span>
                <span className="font-extrabold text-white">{progressPercent}% of {formatBytes(totalBytes)}</span>
              </div>
            </motion.div>
          ) : stagedFilesCount > 0 ? (
            <motion.div 
              initial={{ y: 5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="mt-2 px-5 py-2 rounded-2xl bg-blue-500/20 border border-blue-400/40 text-blue-200 text-xs font-mono font-bold flex items-center gap-2.5 shadow-lg"
            >
              <FileText className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Payload Staged: {stagedFilesCount} item(s) &bull; {formatBytes(stagedTotalSize)}</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/30 text-white text-[10px]">Awaiting Transmit</span>
            </motion.div>
          ) : (
            <p className="text-[11px] font-mono text-slate-400 mt-1">
              Select files or drop directories to stage payload for transmission
            </p>
          )}
        </div>

        {/* NODE 2: TARGET TERMINAL */}
        <motion.div 
          whileHover={{ y: -3 }}
          className="relative w-full lg:w-72 bg-slate-800/80 hover:bg-slate-800 border-2 border-slate-700 hover:border-emerald-500 rounded-3xl p-5 transition-all shadow-xl backdrop-blur-sm"
        >
          {/* Header with Port LEDs */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/70">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/80 animate-pulse" />
              <span className="text-[10px] font-mono font-extrabold text-slate-400 uppercase tracking-widest">
                RJ-45 Port 2
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {isReceive ? 'TRANSMITTER' : 'RECEIVER'}
            </span>
          </div>

          {/* Machine Info */}
          <div className="flex items-center gap-3.5 mt-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
              {isReceive ? <Monitor className="w-6 h-6" /> : <HardDrive className="w-6 h-6" />}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Target Computer
              </span>
              <h4 className="font-extrabold text-sm text-white truncate" title={targetName}>
                {targetName}
              </h4>
              <p className="text-xs font-mono text-emerald-400 truncate mt-0.5">
                {targetIp}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Storage: Downloads</span>
            <span className="text-blue-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> SHA-256
            </span>
          </div>

          {/* Terminal Cable Snap Port (Left side) */}
          <div className="hidden lg:block absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg bg-slate-900 border-2 border-emerald-500 shadow-lg flex items-center justify-center z-20">
            <div className="w-2 h-2 rounded-xs bg-emerald-400 animate-pulse" />
          </div>
        </motion.div>

      </div>
    </div>
  );
};
