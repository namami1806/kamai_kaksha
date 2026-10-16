import React, { useState, useEffect } from 'react';
import MascotKamu from '../../components/MascotKamu';
import { useTranslation } from '../../lib/i18n';
import { 
  Coins, 
  Sparkles, 
  ArrowRight, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  Briefcase, 
  PiggyBank, 
  CheckCircle2, 
  ArrowUpRight,
  RotateCcw,
  Award
} from 'lucide-react';

export default function WalletView({ onOpenCredentials, onBack }) {
  const { t, lang } = useTranslation();
  const [wallet, setWallet] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showCoinBurst, setShowCoinBurst] = useState(true);

  // Play audio chime using Web Audio API synthesized notes (zero external MP3 dependency)
  const playChime = () => {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.1);
        osc.stop(ctx.currentTime + i * 0.1 + 0.4);
      });
    } catch (e) {
      console.warn('Audio chime skipped:', e);
    }
  };

  const loadWallet = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5001/api/wallet/priya_17');
      if (res.ok) {
        const data = await res.json();
        setWallet(data);
      }
    } catch (e) {
      console.warn('Failed to fetch wallet:', e);
    }
  };

  useEffect(() => {
    loadWallet();
    playChime();
    const timer = setTimeout(() => setShowCoinBurst(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const totalEarned = wallet?.totalEarned || 40;
  const availableBalance = wallet?.availableBalance || 36;
  const toolKitFund = wallet?.toolKitFund || 4;

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5 relative">
      
      {/* COIN BURST & CONFETTI ANIMATION PARTICLES */}
      {showCoinBurst && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden flex items-center justify-center">
          {[...Array(14)].map((_, i) => (
            <div
              key={i}
              className="absolute w-7 h-7 rounded-full bg-coin-gold border-2 border-yellow-200 shadow-lg flex items-center justify-center font-black text-xs text-ink animate-bounce"
              style={{
                left: `${35 + (i % 6) * 6}%`,
                top: `${40 + (i % 4) * 8}%`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: '1.2s'
              }}
            >
              ₹
            </div>
          ))}
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-1">
        <button
          onClick={onBack}
          className="min-h-[44px] px-4 py-2 rounded-full bg-white text-ink border border-ink/15 text-xs font-bold hover:bg-[#F2F4FC] transition-all flex items-center gap-1.5 shadow-xs"
        >
          <span>← Back to Path</span>
        </button>

        {/* Audio Sound & Mute Toggle */}
        <button
          onClick={() => {
            setIsMuted(!isMuted);
            if (isMuted) playChime();
          }}
          className="min-h-[44px] px-3.5 py-1.5 rounded-full bg-white text-ink border border-ink/15 text-xs font-bold hover:bg-[#F2F4FC] flex items-center gap-1.5 transition-all shadow-xs"
          aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}
        >
          {isMuted ? (
            <>
              <VolumeX className="w-4 h-4 text-rose-500" />
              <span>Muted</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span>Audio On</span>
            </>
          )}
        </button>
      </div>

      {/* Hero Wallet Card */}
      <div className="bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#1E293B] text-white rounded-32 p-6 sm:p-8 shadow-xl relative overflow-hidden space-y-6">
        
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-coin-gold/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left relative z-10">
          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-coin-gold px-2.5 py-0.5 rounded-full bg-coin-gold/15 border border-coin-gold/30">
                Wow-Flow Step 4 • First Earning Achieved
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Simulated UPI Live
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black font-display text-white mt-1">
              Priya's Village Earning Wallet
            </h1>
            <p className="text-xs text-slate-300 font-medium">
              Tekari, Gaya • Solar Hybrid Inverter Grounding Completed
            </p>
          </div>

          <div className="animate-float">
            <MascotKamu state="celebrating" size={90} />
          </div>
        </div>

        {/* 10% AUTO-SAVE & AVAILABLE BALANCE GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
          
          {/* Card 1: Total Micro-task Earning */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Total Task Reward
            </span>
            <div className="text-2xl sm:text-3xl font-black font-display text-coin-gold flex items-baseline gap-1">
              <span>₹{totalEarned}</span>
              <span className="text-xs font-bold text-slate-400">earned</span>
            </div>
            <p className="text-[10px] text-slate-400">100% of task contract value</p>
          </div>

          {/* Card 2: 10% Auto-Saved Tool Kit Fund */}
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 backdrop-blur-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                Tool Kit Fund (10% Auto-Save)
              </span>
              <PiggyBank className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black font-display text-emerald-300 flex items-baseline gap-1">
              <span>₹{toolKitFund}</span>
              <span className="text-xs font-bold text-emerald-400/80">auto-saved</span>
            </div>
            <p className="text-[10px] text-emerald-200/70">Reserved for soldering iron & multimeter</p>
          </div>

          {/* Card 3: Available Cash */}
          <div className="p-4 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-xs space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-200 block">
              Available Cash
            </span>
            <div className="text-2xl sm:text-3xl font-black font-display text-white flex items-baseline gap-1">
              <span>₹{availableBalance}</span>
              <span className="text-xs font-bold text-slate-400">spendable</span>
            </div>
            <p className="text-[10px] text-slate-300">Ready for simulated UPI withdrawal</p>
          </div>
        </div>

        {/* SIMULATED UPI DISCLAIMER CHIP */}
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-slate-300 text-[11px]">
              VPA: <strong className="text-white">priya@okgramin</strong> (Simulated UPI • Demo Only • No Real Money Moved)
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Simulated Instant Settlement
          </span>
        </div>

        {/* CTA TO NEXT STEP (WOW-FLOW STEP 5: VERIFIABLE CREDENTIAL) */}
        <div className="pt-2">
          <button
            onClick={onOpenCredentials}
            className="w-full min-h-[48px] rounded-full bg-primary hover:bg-primary-hover text-white font-black text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Award className="w-5 h-5 text-coin-gold" />
            <span>Proceed to Step 5: View Ed25519 Signed Credential with QR →</span>
          </button>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="bg-white rounded-32 border border-black/10 p-5 sm:p-7 shadow-bento space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-black font-display text-ink">
            Verified Village Ledger • लेन-देन विवरण
          </h2>
          <span className="text-[10px] font-mono font-bold text-ink/60 bg-[#F6F8FD] px-2.5 py-1 rounded-full border border-ink/10">
            1 Completed Transaction
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#F8F9FD] border border-ink/10 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center font-black">
              ✓
            </div>
            <div>
              <span className="font-bold text-xs text-ink block">
                Gram Panchayat Solar Inverter Grounding
              </span>
              <span className="text-[11px] font-mono text-ink/60 block">
                Ref: {wallet?.transactions?.[0]?.simulatedUpiRef || 'UPI-MOCK-987623'} • Tekari Block
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="font-black text-sm text-ink block text-emerald-700">
              + ₹40.00
            </span>
            <span className="text-[10px] text-emerald-700 font-bold block">
              (₹36 Cash + ₹4 Tool Kit Fund)
            </span>
          </div>
        </div>

        <p className="text-[10px] text-ink/50 text-center font-medium">
          Sample financial ledger modelled on rural micro-ATM and SHG bank accounts. No real fiat transfer takes place.
        </p>
      </div>

    </div>
  );
}
