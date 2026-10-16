import React from 'react';
import MascotKamu from '../components/MascotKamu';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Coins, 
  ShieldCheck, 
  Lock, 
  MapPin, 
  ArrowLeft,
  Flame,
  Zap,
  Award
} from 'lucide-react';

export default function ShowcasePage({ onBack, onNavigate, personaMode, setPersonaMode }) {
  const isFresh = personaMode === 'fresh';

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6 text-ink">
      
      {/* Top Header */}
      <div className="flex items-center justify-between pb-1">
        <button
          onClick={onBack}
          className="min-h-[44px] px-4 py-2 rounded-full bg-white text-ink border border-ink/15 text-xs font-bold hover:bg-[#F2F4FC] transition-all flex items-center gap-1.5 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to App</span>
        </button>

        <span className="text-[10px] font-mono font-bold text-ink/70 bg-white px-3 py-1 rounded-full border border-ink/10 shadow-xs">
          Interactive Showcase Gallery
        </span>
      </div>

      {/* Hero Card */}
      <div className="bg-white rounded-32 border border-black/10 p-6 sm:p-8 shadow-bento space-y-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
              Interactive Persona Switcher
            </span>
            <h1 className="text-2xl sm:text-3xl font-black font-display text-ink leading-tight">
              Priya's Journey Showcase
            </h1>
            <p className="text-xs sm:text-sm text-ink/80 font-medium max-w-lg">
              Toggle between Day 0 evaluation state and the returning graduate profile to inspect progressive earning metrics.
            </p>
          </div>

          <div className="shrink-0 animate-float">
            <MascotKamu state={isFresh ? 'coach' : 'celebrate'} size={95} />
          </div>
        </div>

        {/* Persona Mode Switcher Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => setPersonaMode('fresh')}
            className={`p-4 rounded-24 border text-left transition-all ${
              isFresh
                ? 'bg-primary text-white border-primary shadow-md'
                : 'bg-[#F8F9FD] text-ink border-black/10 hover:border-primary/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-black text-xs uppercase tracking-wider">
                Persona 1: Fresh Priya (Day 0)
              </span>
              {isFresh && <span className="text-xs font-mono font-bold px-2 py-0.2 bg-white/20 rounded-full">ACTIVE</span>}
            </div>
            <p className={`text-xs mt-1 font-medium ${isFresh ? 'text-white/80' : 'text-ink/70'}`}>
              Day 0 • Streak: 0 Days • XP: 0 • Earned: ₹0
            </p>
            <span className={`text-[11px] block mt-2 font-bold ${isFresh ? 'text-butter' : 'text-primary'}`}>
              Evaluates the complete Wow-Flow from start →
            </span>
          </button>

          <button
            onClick={() => setPersonaMode('returning')}
            className={`p-4 rounded-24 border text-left transition-all ${
              !isFresh
                ? 'bg-ink text-white border-ink shadow-md'
                : 'bg-[#F8F9FD] text-ink border-black/10 hover:border-ink/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-black text-xs uppercase tracking-wider">
                Persona 2: Returning Priya (Day 14)
              </span>
              {!isFresh && <span className="text-xs font-mono font-bold px-2 py-0.2 bg-white/20 rounded-full">ACTIVE</span>}
            </div>
            <p className={`text-xs mt-1 font-medium ${!isFresh ? 'text-white/80' : 'text-ink/70'}`}>
              Day 14 • Streak: 14 Days • XP: 480 • Earned: ₹17,184
            </p>
            <span className={`text-[11px] block mt-2 font-bold ${!isFresh ? 'text-coin-gold' : 'text-ink'}`}>
              Evaluates accumulated credit history & ledger →
            </span>
          </button>
        </div>
      </div>

      {/* WOW-FLOW MILESTONE CARDS */}
      <div className="space-y-3">
        <h2 className="text-lg font-black font-display text-ink">
          The 5 Core Wow-Flow Moments
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              step: '1',
              title: 'DPDP Plain-Language Consent',
              desc: 'Explicit consent gate with guardian OTP step for minor Priya (age 17) before voice capture.',
              tab: 'home',
              badge: 'DPDP Safeguard'
            },
            {
              step: '2',
              title: 'Voice Life Map (Offline Queue)',
              desc: 'Spoken vocational discovery in Hindi/Magahi. Audio queued in IndexedDB, deleted on transcription.',
              tab: 'lifemap',
              badge: 'Audio Deleted on Sync'
            },
            {
              step: '3',
              title: 'Winding Path & Module 1',
              desc: 'Interactive soldering & inverter DC safety module (+40 XP) unlocking the village micro-task.',
              tab: 'lifemap',
              badge: 'Interactive Game Layer'
            },
            {
              step: '4',
              title: 'Village Task & 10% Auto-Save',
              desc: 'Submit multimeter evidence -> 3-peer cross-validation -> ₹40 reward (₹4 Tool Kit Fund, ₹36 spendable).',
              tab: 'wallet',
              badge: 'Simulated UPI'
            },
            {
              step: '5',
              title: 'Ed25519 Verifiable Credential',
              desc: 'Server-side signed W3C vocational credential with cryptographic QR verification and DigiLocker JSON export.',
              tab: 'credentials',
              badge: 'RFC 8032 Ed25519'
            },
            {
              step: '6',
              title: 'Gaon Guru Job Radar',
              desc: 'Rules-based skill matching connecting Priya to PM Surya Ghar rooftop solar clusters around Gaya District.',
              tab: 'radar',
              badge: 'Rules Engine'
            }
          ].map((card, idx) => (
            <div key={idx} className="bg-white rounded-24 border border-black/10 p-5 shadow-xs flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-black text-xs flex items-center justify-center">
                    {card.step}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#F6F8FD] border border-ink/10 text-ink/70">
                    {card.badge}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-ink">{card.title}</h3>
                <p className="text-xs text-ink/70 font-medium leading-relaxed">{card.desc}</p>
              </div>

              <button
                onClick={() => onNavigate(card.tab)}
                className="w-full min-h-[38px] px-3 py-1.5 rounded-xl bg-[#F6F8FD] hover:bg-butter-light text-ink text-xs font-bold border border-ink/10 flex items-center justify-center gap-1.5 transition-all"
              >
                <span>Jump to Screen</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Facilitator Direct Jump */}
      <div className="bg-[#0F172A] rounded-32 p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-butter block">
            Cohort Facilitator Tool
          </span>
          <h3 className="text-base sm:text-lg font-black font-display text-white">
            Facilitator Monitoring Dashboard
          </h3>
          <p className="text-xs text-slate-300 font-medium">
            Inspect real-time student batch completion rates, sync health, and village tool-kit pool.
          </p>
        </div>

        <button
          onClick={() => onNavigate('facilitator')}
          className="min-h-[44px] px-5 py-2 rounded-full bg-butter hover:bg-butter-hover text-ink font-black text-xs shrink-0 transition-all shadow-md active:scale-95"
        >
          Open Facilitator Dashboard →
        </button>
      </div>

    </div>
  );
}
