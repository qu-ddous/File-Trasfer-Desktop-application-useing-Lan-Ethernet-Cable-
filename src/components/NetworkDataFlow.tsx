import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Monitor, 
  HardDrive, 
  Zap, 
  FileText, 
  ShieldCheck, 
  Activity,
  Layers,
  Sparkles,
  ArrowRight,
  Radio,
  Cpu
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
  const isReceive = mode === 'receive';
  const hasPeer = Boolean(peerIp && peerIp !== '127.0.0.1' && !peerIp.includes('Target'));
  
  const sourceName = isReceive ? (peerDeviceName || 'Connected LAN Peer') : localDeviceName;
  const sourceIp = isReceive ? (peerIp || 'Remote IP') : localIp;
  const targetName = isReceive ? localDeviceName : (peerDeviceName || 'Target Computer');
  const targetIp = isReceive ? localIp : (peerIp || 'Target IP');

  const progressPercent = totalBytes > 0 ? Math.min(Math.round((transferredBytes / totalBytes) * 100), 100) : 0;
  const displaySpeed = currentSpeed > 0 ? formatSpeed(currentSpeed) : '1000 Mbps Ready';

  // Subtle interactive 3D tilt state
  const [rotateOffset, setRotateOffset] = useState({ x: 12, y: -6 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width - 0.5;
    const yRatio = (e.clientY - rect.top) / rect.height - 0.5;
    // Map within controlled bounds for comfortable isometric viewing
    setRotateOffset({
      x: 12 - yRatio * 10,
      y: -6 + xRatio * 12
    });
  };

  const handleMouseLeave = () => {
    setRotateOffset({ x: 12, y: -6 });
  };

  return (
    <div 
      className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl p-7 text-white select-none transition-all duration-300"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: '1200px'
      }}
    >
      {/* Background High-Tech Schematic Ambient Grid */}
      <div 
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#38BDF8 1px, transparent 1px), linear-gradient(to right, #1E293B 1px, transparent 1px), linear-gradient(to bottom, #1E293B 1px, transparent 1px)',
          backgroundSize: '24px 24px, 96px 96px, 96px 96px'
        }}
      />
      <div className="absolute top-0 left-1/4 w-96 h-36 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Telemetry Header Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-sm font-black tracking-wider uppercase text-slate-100 flex items-center gap-2">
                3D Gigabit Ethernet Pipeline
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide ${
                isStreaming
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-pulse'
                  : hasPeer
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {isStreaming ? '⚡ 3D PHOTONIC STREAM ACTIVE' : hasPeer ? 'LINK SATURATED (1000M)' : 'READY FOR TRANSFER'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Zero-Router Direct Hardware Cable &bull; Native TCP Sockets &bull; SHA-256 Validated
            </p>
          </div>
        </div>

        {/* Live Speed Indicator */}
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
              Buffer: 1 MB Direct
            </span>
          </div>
        </div>
      </div>

      {/* 3D ISOMETRIC STAGE CONTAINER */}
      <div 
        className="relative z-10 py-10 px-2 flex flex-col lg:flex-row items-center justify-between gap-8 transition-transform duration-300 ease-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotateOffset.x}deg) rotateY(${rotateOffset.y}deg)`
        }}
      >
        {/* 3D Shadow Cast Substrate (Beneath all nodes) */}
        <div 
          className="absolute inset-x-8 inset-y-4 rounded-3xl bg-black/40 blur-2xl pointer-events-none"
          style={{ transform: 'translateZ(-30px)' }}
        />

        {/* ================= NODE 1: SOURCE TERMINAL (3D Floating Card) ================= */}
        <motion.div 
          whileHover={{ y: -6, z: 45 }}
          className="relative w-full lg:w-72 rounded-3xl p-5 backdrop-blur-md transition-all duration-300"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'translateZ(25px)',
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 0 20px rgba(59, 130, 246, 0.2)',
            border: '1px solid rgba(59, 130, 246, 0.4)'
          }}
        >
          {/* 3D Extrusion Edge Highlight */}
          <div className="absolute inset-0 rounded-3xl border-t border-l border-blue-400/30 pointer-events-none" />

          {/* Header with Port LEDs */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/70">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/80 animate-pulse" />
              <span className="text-[10px] font-mono font-extrabold text-slate-300 uppercase tracking-widest">
                RJ-45 Terminal 1
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/25 text-blue-300 border border-blue-500/40 shadow-xs">
              {isReceive ? 'RECEIVER' : 'TRANSMITTER'}
            </span>
          </div>

          {/* Machine Info */}
          <div className="flex items-center gap-3.5 mt-4">
            <div 
              className="w-13 h-13 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 shrink-0"
              style={{ transform: 'translateZ(15px)' }}
            >
              <Monitor className="w-7 h-7" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Source Computer
              </span>
              <h4 className="font-extrabold text-sm text-white truncate" title={sourceName}>
                {sourceName}
              </h4>
              <p className="text-xs font-mono text-blue-400 truncate mt-0.5 font-bold">
                {sourceIp}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Protocol: TCP Socket</span>
            <span className="text-emerald-400 font-bold">Port 52521</span>
          </div>

          {/* 3D Hardware RJ-45 Connector Block (Right facing) */}
          <div 
            className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-slate-900 border-2 border-blue-400 shadow-xl items-center justify-center z-30"
            style={{
              transform: 'translateZ(20px)',
              boxShadow: '0 10px 20px rgba(0,0,0,0.6), 0 0 12px rgba(59,130,246,0.6)'
            }}
          >
            <div className="w-2.5 h-2.5 rounded-xs bg-blue-400 animate-ping" />
          </div>
        </motion.div>

        {/* ================= CENTER: 3D CYLINDRICAL GLOWING CONDUIT ================= */}
        <div 
          className="relative flex-1 w-full flex flex-col items-center justify-center my-6 lg:my-0 px-4"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'translateZ(30px)'
          }}
        >
          {/* Main 3D Cylindrical Conduit Sleeve */}
          <div className="w-full relative h-20 flex items-center justify-center">
            
            {/* 3D Cylindrical Tube Body with Depth Lighting */}
            <div 
              className="w-full h-7 rounded-full bg-slate-900/90 border border-slate-700 shadow-2xl overflow-hidden relative"
              style={{
                boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.9), 0 8px 16px rgba(0,0,0,0.6), 0 0 15px rgba(59,130,246,0.3)',
                background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 40%, #020617 100%)'
              }}
            >
              {/* Inner Luminous Optic Core */}
              <div className={`h-full w-full transition-all duration-500 ${
                isStreaming
                  ? 'bg-gradient-to-r from-blue-500 via-purple-500 via-pink-500 to-emerald-400 animate-pulse'
                  : hasPeer
                  ? 'bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 opacity-70'
                  : 'bg-slate-800 opacity-40'
              }`} />

              {/* Cylindrical Glass Reflection Line */}
              <div className="absolute top-1 left-0 right-0 h-1 bg-white/20 rounded-full blur-[0.5px] pointer-events-none" />
            </div>

            {/* 3D Metallic Collar Rings on the Tube */}
            <div className="absolute left-6 h-9 w-2.5 rounded-sm bg-gradient-to-r from-slate-400 to-slate-700 shadow-md border border-slate-500" />
            <div className="absolute right-6 h-9 w-2.5 rounded-sm bg-gradient-to-r from-slate-700 to-slate-400 shadow-md border border-slate-500" />

            {/* 3D FLOATING PHOTONIC PACKETS (TRANSMISSION BEAM) */}
            {isStreaming ? (
              <div 
                className="absolute inset-0 flex items-center justify-between pointer-events-none"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: 'translateZ(25px)'
                }}
              >
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      x: ['-50px', '320px'],
                      scale: [0.75, 1.4, 0.75],
                      opacity: [0, 1, 1, 0]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.05,
                      delay: i * 0.17,
                      ease: 'easeInOut'
                    }}
                    className="w-6 h-6 rounded-full bg-white border-2 border-purple-300 flex items-center justify-center"
                    style={{
                      boxShadow: '0 0 20px #C084FC, 0 0 35px #9333EA, 0 12px 20px rgba(0,0,0,0.8)'
                    }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-ping" />
                  </motion.div>
                ))}
              </div>
            ) : hasPeer ? (
              <div 
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{ transform: 'translateZ(15px)' }}
              >
                <motion.div 
                  animate={{ scale: [1, 1.06, 1], opacity: [0.85, 1, 0.85] }}
                  transition={{ repeat: Infinity, duration: 2.2 }}
                  className="px-4 py-1.5 rounded-full bg-slate-950/90 border border-emerald-400/60 text-emerald-300 text-[10px] font-mono font-black tracking-widest uppercase shadow-lg shadow-emerald-500/25 flex items-center gap-2"
                >
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  Direct Cat6/7 Gigabit Link Ready
                </motion.div>
              </div>
            ) : (
              <div 
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{ transform: 'translateZ(15px)' }}
              >
                <span className="px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-slate-700 text-slate-400 text-[10px] font-mono font-bold tracking-wider uppercase shadow-md">
                  Plug Ethernet Cable to Initiate Link
                </span>
              </div>
            )}
          </div>

          {/* ================= 3D HOLOGRAPHIC FLOATING HUD ================= */}
          {isStreaming ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mt-3 w-full max-w-sm rounded-2xl p-4 shadow-2xl space-y-2.5 text-center backdrop-blur-xl border border-purple-500/40"
              style={{
                transform: 'translateZ(55px)',
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(88, 28, 135, 0.35) 100%)',
                boxShadow: '0 25px 50px -10px rgba(0, 0, 0, 0.9), 0 0 25px rgba(168, 85, 247, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
              }}
            >
              <div className="flex items-center justify-between text-xs font-mono font-bold">
                <span className="truncate pr-2 text-purple-300 font-extrabold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-400 animate-spin" />
                  {activeItemName || 'Streaming Gigabit Payload'}
                </span>
                <span className="text-emerald-400 font-black text-sm px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                  {formatSpeed(currentSpeed)}
                </span>
              </div>

              {/* Holographic Progress Track */}
              <div className="w-full bg-slate-900/90 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-300 shadow-sm shadow-purple-500/50"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono text-slate-300 pt-0.5">
                <span>{formatBytes(transferredBytes)} transferred</span>
                <span className="font-extrabold text-white bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                  {progressPercent}% of {formatBytes(totalBytes)}
                </span>
              </div>
            </motion.div>
          ) : stagedFilesCount > 0 ? (
            <motion.div 
              initial={{ y: 5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="mt-3 px-5 py-2.5 rounded-2xl text-blue-200 text-xs font-mono font-bold flex items-center gap-2.5 shadow-xl border border-blue-400/50 backdrop-blur-md"
              style={{
                transform: 'translateZ(45px)',
                background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.8), 0 0 20px rgba(59, 130, 246, 0.3)'
              }}
            >
              <FileText className="w-4 h-4 text-blue-300 shrink-0" />
              <span>Payload Staged: {stagedFilesCount} item(s) &bull; {formatBytes(stagedTotalSize)}</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/40 text-white text-[10px] border border-blue-400/40">
                Ready to Send
              </span>
            </motion.div>
          ) : (
            <p 
              className="text-[11px] font-mono text-slate-400 mt-2 text-center"
              style={{ transform: 'translateZ(10px)' }}
            >
              Select files or drag-and-drop to initiate hardware transmission
            </p>
          )}
        </div>

        {/* ================= NODE 2: TARGET TERMINAL (3D Floating Card) ================= */}
        <motion.div 
          whileHover={{ y: -6, z: 45 }}
          className="relative w-full lg:w-72 rounded-3xl p-5 backdrop-blur-md transition-all duration-300"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'translateZ(25px)',
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 0 20px rgba(16, 185, 129, 0.2)',
            border: '1px solid rgba(16, 185, 129, 0.4)'
          }}
        >
          {/* 3D Extrusion Edge Highlight */}
          <div className="absolute inset-0 rounded-3xl border-t border-l border-emerald-400/30 pointer-events-none" />

          {/* Header with Port LEDs */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/70">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/80 animate-pulse" />
              <span className="text-[10px] font-mono font-extrabold text-slate-300 uppercase tracking-widest">
                RJ-45 Terminal 2
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-xs">
              {isReceive ? 'TRANSMITTER' : 'RECEIVER'}
            </span>
          </div>

          {/* Machine Info */}
          <div className="flex items-center gap-3.5 mt-4">
            <div 
              className="w-13 h-13 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 shrink-0"
              style={{ transform: 'translateZ(15px)' }}
            >
              {isReceive ? <Monitor className="w-7 h-7" /> : <HardDrive className="w-7 h-7" />}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Target Computer
              </span>
              <h4 className="font-extrabold text-sm text-white truncate" title={targetName}>
                {targetName}
              </h4>
              <p className="text-xs font-mono text-emerald-400 truncate mt-0.5 font-bold">
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

          {/* 3D Hardware RJ-45 Connector Block (Left facing) */}
          <div 
            className="hidden lg:flex absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-slate-900 border-2 border-emerald-400 shadow-xl items-center justify-center z-30"
            style={{
              transform: 'translateZ(20px)',
              boxShadow: '0 10px 20px rgba(0,0,0,0.6), 0 0 12px rgba(16,185,129,0.6)'
            }}
          >
            <div className="w-2.5 h-2.5 rounded-xs bg-emerald-400 animate-ping" />
          </div>
        </motion.div>

      </div>
    </div>
  );
};
