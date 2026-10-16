import React, { useState } from 'react';
import MascotKamu from '../components/MascotKamu';
import { 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Globe, 
  RotateCcw, 
  ArrowLeft,
  ExternalLink,
  Sparkles
} from 'lucide-react';

export default function DemoFramePage({ onBack }) {
  const [framePersona, setFramePersona] = useState('fresh');
  const [frameLang, setFrameLang] = useState('en');
  const [frameOffline, setFrameOffline] = useState(false);
  const [frameView, setFrameView] = useState('home');

  const frameUrl = `/?view=${frameView}&persona=${framePersona}&lang=${frameLang}&offline=${frameOffline}`;

  return (
    <div className="w-full min-h-screen bg-[#0F172A] text-white px-0 py-2 sm:p-6 flex flex-col items-center">
      
      {/* Top Header Controls Bar */}
      <div className="w-full max-w-5xl flex items-center justify-between pb-4 border-b border-white/10">
        <button
          onClick={onBack}
          className="min-h-[44px] px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 text-xs font-bold transition-all flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Frame</span>
        </button>

        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-primary-light" />
          <span className="text-xs font-black uppercase tracking-wider font-display">
            360px Mobile Frame Simulator
          </span>
        </div>

        <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
          360 × 780 Viewport
        </span>
      </div>

      {/* Main Sandbox Layout: Controls + Device Frame */}
      <div className="w-full max-w-5xl flex-1 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 pt-6">
        
        {/* Left Toolbar for Evaluators */}
        <div className="w-full lg:w-72 bg-white/5 border border-white/10 rounded-24 p-5 space-y-4 shrink-0">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-butter block">
              Evaluator Controls
            </span>
            <h3 className="font-bold text-sm text-white">Live Parameter Injection</h3>
            <p className="text-[11px] text-slate-300">
              Switch network, language, and persona states inside the 360px mobile viewport.
            </p>
          </div>

          {/* Persona Switch */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-200 block">Student Persona:</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setFramePersona('fresh')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all ${
                  framePersona === 'fresh'
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                }`}
              >
                Fresh (Day 0)
              </button>
              <button
                onClick={() => setFramePersona('returning')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all ${
                  framePersona === 'returning'
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                }`}
              >
                Returning (Day 14)
              </button>
            </div>
          </div>

          {/* Language Switch */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-200 block">Language:</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setFrameLang('en')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all ${
                  frameLang === 'en'
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setFrameLang('hi')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all ${
                  frameLang === 'hi'
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                }`}
              >
                हिंदी (Hindi)
              </button>
            </div>
          </div>

          {/* Network Switch */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-200 block">Network Mode:</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setFrameOffline(false)}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 ${
                  !frameOffline
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                }`}
              >
                <Wifi className="w-3.5 h-3.5" />
                <span>Online</span>
              </button>
              <button
                onClick={() => setFrameOffline(true)}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 ${
                  frameOffline
                    ? 'bg-amber-600 text-white border-amber-500 shadow-xs'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                }`}
              >
                <WifiOff className="w-3.5 h-3.5" />
                <span>Offline</span>
              </button>
            </div>
          </div>

          {/* Quick Jump Links */}
          <div className="space-y-1.5 pt-2 border-t border-white/10">
            <label className="text-xs font-bold text-slate-200 block">Jump to Screen:</label>
            <div className="space-y-1">
              {[
                { id: 'home', label: 'Student Home' },
                { id: 'lifemap', label: 'Voice Life Map' },
                { id: 'learning_path', label: 'Learning Path (Module 1)' },
                { id: 'wallet', label: 'Priya\'s Wallet (₹40)' },
                { id: 'credentials', label: 'Ed25519 Credential (QR)' },
                { id: 'radar', label: 'Gaon Guru Job Radar' },
                { id: 'facilitator', label: 'Facilitator Dashboard' }
              ].map(screen => (
                <button
                  key={screen.id}
                  onClick={() => setFrameView(screen.id)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    frameView === screen.id
                      ? 'bg-white/20 text-white border-white/30 font-bold'
                      : 'bg-transparent text-slate-300 border-transparent hover:bg-white/5'
                  }`}
                >
                  {screen.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Phone Bezel Container */}
        <div className="relative p-0 sm:p-3 bg-black rounded-none sm:rounded-[48px] border-0 sm:border-4 border-slate-700 shadow-2xl w-full max-w-[360px] flex justify-center">
          
          {/* Speaker / Camera Notch */}
          <div className="hidden sm:flex absolute top-6 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-900 rounded-full z-20 items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
          </div>

          {/* Simulated 360x780 Screen Viewport */}
          <div className="w-[360px] max-w-full h-[720px] sm:h-[780px] bg-[#F6F8FD] rounded-none sm:rounded-[36px] overflow-hidden relative shadow-inner">
            <iframe
              key={frameUrl}
              src={frameUrl}
              title="Kamai Kaksha 360px Simulation"
              className="w-full h-full border-0 select-none"
            />
          </div>

          {/* Home Bar Indicator */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-600 rounded-full z-20" />
        </div>

      </div>

    </div>
  );
}
