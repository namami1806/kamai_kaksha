import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Wifi, 
  WifiOff, 
  UserCheck, 
  RotateCcw, 
  Mic, 
  Palette, 
  X,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { queueSyncEvent } from '../lib/idb-queue';

export default function DemoModeDock({
  personaMode,
  setPersonaMode,
  isSimulatedOffline,
  setIsSimulatedOffline,
  onOpenTokens,
  onOpenFacilitator,
  onSimulateVoice,
  onOpenTask,
  onOpenWallet,
  onOpenCredentials,
  onOpenRadar,
  onOpenAbout,
  onOpenShowcase,
  onOpenDemoFrame
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Keyboard shortcut Ctrl+Shift+D to toggle dock
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Floating Demo Trigger Pill at Bottom-Right */}
      <div className="fixed bottom-4 right-4 z-50 select-none">
        <button
          onClick={() => setIsOpen(prev => !prev)}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-ink/90 hover:bg-ink text-butter border border-butter/30 shadow-lg text-xs font-bold transition-all hover:scale-105 active:scale-95 backdrop-blur-md"
          title="Demo Mode Controls (Shortcut: Ctrl+Shift+D)"
        >
          <Sliders className="w-3.5 h-3.5 text-butter" />
          <span>Demo Mode</span>
          {isSimulatedOffline && (
            <span className="w-2 h-2 rounded-full bg-rose animate-ping" />
          )}
        </button>
      </div>

      {/* Slide-over / Modal Demo Controls Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-center bg-black/40 backdrop-blur-xs p-3">
          <div className="bg-white rounded-32 border border-black/10 shadow-2xl p-5 w-full max-w-md space-y-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-black/5">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-primary" />
                <h3 className="font-extrabold text-sm text-ink font-display">
                  Citi Hackathon • Demo Mode Controls
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full text-ink/60 hover:text-ink hover:bg-black/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1. Persona Switcher */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-ink/60 uppercase tracking-wider block">
                Student Persona State
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPersonaMode('fresh')}
                  className={`p-2.5 rounded-2xl border text-xs font-bold text-left transition-all ${
                    personaMode === 'fresh'
                      ? 'bg-butter text-ink border-ink/30 shadow-xs'
                      : 'bg-[#F8F9FD] text-ink/70 border-black/5 hover:bg-white'
                  }`}
                >
                  <p className="font-extrabold text-ink">🌱 Fresh Priya</p>
                  <p className="text-[10px] text-ink/80 mt-0.5">Day 0 • ₹0 • No Modules</p>
                </button>
                <button
                  onClick={() => setPersonaMode('returning')}
                  className={`p-2.5 rounded-2xl border text-xs font-bold text-left transition-all ${
                    personaMode === 'returning'
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-[#F8F9FD] text-ink/70 border-black/5 hover:bg-white'
                  }`}
                >
                  <p className="font-extrabold">⚡ Returning Priya</p>
                  <p className={`text-[10px] mt-0.5 ${personaMode === 'returning' ? 'text-white/80' : 'text-ink/80'}`}>
                    Day 14 • ₹40 • 120 XP
                  </p>
                </button>
              </div>
            </div>

            {/* 2. Network Simulation */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-ink/60 uppercase tracking-wider block">
                Offline First Simulator
              </span>
              <button
                onClick={() => setIsSimulatedOffline(prev => !prev)}
                className={`w-full p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all ${
                  isSimulatedOffline
                    ? 'bg-ink text-butter border-butter'
                    : 'bg-[#F8F9FD] text-ink border-black/5 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isSimulatedOffline ? (
                    <WifiOff className="w-4 h-4 text-butter animate-pulse" />
                  ) : (
                    <Wifi className="w-4 h-4 text-emerald-600" />
                  )}
                  <span>
                    {isSimulatedOffline ? 'Simulated Offline (Active)' : 'Normal Online Network'}
                  </span>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10">
                  {isSimulatedOffline ? 'Tap to Reconnect' : 'Tap to Go Offline'}
                </span>
              </button>
            </div>

            {/* 3. Priya Voice Backup Trigger */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-ink/60 uppercase tracking-wider block">
                Speech Fallback
              </span>
              <button
                onClick={() => {
                  if (onSimulateVoice) onSimulateVoice();
                  setIsOpen(false);
                }}
                className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-butter to-coin-gold text-ink font-bold text-xs flex items-center justify-between shadow-xs hover:brightness-105 active:scale-98 transition-all"
              >
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-ink" />
                  <span>Simulate Priya's Voice Input</span>
                </div>
                <span className="text-[10px] bg-ink/10 px-2 py-0.5 rounded-full font-bold">
                  Demo Audio
                </span>
              </button>
            </div>

            {/* 4. M4 Quick Links: Task, Wallet, Credential, Radar */}
            <div className="pt-2 border-t border-black/5 space-y-1.5">
              <span className="text-[11px] font-bold text-ink/60 uppercase tracking-wider block">
                M4 Wow-Flow Quick Links
              </span>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => {
                    if (onOpenTask) onOpenTask();
                    setIsOpen(false);
                  }}
                  className="p-2 rounded-xl bg-[#F6F8FD] hover:bg-butter/30 text-ink font-bold text-[11px] text-left border border-ink/10 transition-all"
                >
                  🛠️ Task & 3-Peer Cross-Val
                </button>

                <button
                  onClick={() => {
                    if (onOpenWallet) onOpenWallet();
                    setIsOpen(false);
                  }}
                  className="p-2 rounded-xl bg-[#F6F8FD] hover:bg-coin-gold/20 text-ink font-bold text-[11px] text-left border border-ink/10 transition-all"
                >
                  💰 Wallet (₹40 + ₹4 Fund)
                </button>

                <button
                  onClick={() => {
                    if (onOpenCredentials) onOpenCredentials();
                    setIsOpen(false);
                  }}
                  className="p-2 rounded-xl bg-[#F6F8FD] hover:bg-primary/15 text-ink font-bold text-[11px] text-left border border-ink/10 transition-all"
                >
                  📜 Ed25519 Credential (QR)
                </button>

                <button
                  onClick={() => {
                    if (onOpenRadar) onOpenRadar();
                    setIsOpen(false);
                  }}
                  className="p-2 rounded-xl bg-[#F6F8FD] hover:bg-emerald-100 text-ink font-bold text-[11px] text-left border border-ink/10 transition-all"
                >
                  🧭 Gaon Guru Job Radar
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <button
                  onClick={() => {
                    if (onOpenAbout) onOpenAbout();
                    setIsOpen(false);
                  }}
                  className="p-1.5 rounded-lg bg-white/60 hover:bg-white text-ink font-bold text-[10px] text-center border border-ink/10 transition-all"
                >
                  ℹ️ About
                </button>
                <button
                  onClick={() => {
                    if (onOpenShowcase) onOpenShowcase();
                    setIsOpen(false);
                  }}
                  className="p-1.5 rounded-lg bg-white/60 hover:bg-white text-ink font-bold text-[10px] text-center border border-ink/10 transition-all"
                >
                  ✨ Showcase
                </button>
                <button
                  onClick={() => {
                    if (onOpenDemoFrame) onOpenDemoFrame();
                    setIsOpen(false);
                  }}
                  className="p-1.5 rounded-lg bg-white/60 hover:bg-white text-ink font-bold text-[10px] text-center border border-ink/10 transition-all"
                >
                  📱 360px Frame
                </button>
              </div>

              <button
                onClick={() => {
                  if (onOpenFacilitator) onOpenFacilitator();
                  setIsOpen(false);
                }}
                className="w-full p-2 rounded-xl bg-lavender/40 hover:bg-lavender/70 text-ink font-bold text-xs flex items-center justify-between transition-all"
              >
                <span className="flex items-center gap-1.5">
                  <span className="text-sm">📊</span>
                  <span>Facilitator Dashboard (Gaya Pilot)</span>
                </span>
                <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-black/5">Open</span>
              </button>

              <div className="flex items-center justify-between text-xs font-bold pt-1">
                <button
                  onClick={() => {
                    if (onOpenTokens) onOpenTokens();
                    setIsOpen(false);
                  }}
                  className="text-primary hover:underline flex items-center gap-1.5"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Inspect Design Tokens & Contrast</span>
                </button>
                <span className="text-[10px] text-ink/40 font-mono">
                  Press Ctrl+Shift+D
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
