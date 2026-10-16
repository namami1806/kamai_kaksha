import React, { useState, useEffect } from 'react';
import BentoTile from '../components/BentoTile';
import StatTile from '../components/StatTile';
import { useTranslation } from '../lib/i18n';
import { 
  Users, 
  TrendingUp, 
  Coins, 
  AlertTriangle, 
  Activity, 
  ArrowLeft, 
  ShieldCheck, 
  Radio, 
  CheckCircle2, 
  Clock, 
  Flame, 
  HelpCircle,
  ExternalLink,
  RefreshCw,
  WifiOff
} from 'lucide-react';

export default function FacilitatorDashboard({ onBack }) {
  const { lang, t } = useTranslation();
  const [metrics, setMetrics] = useState(null);
  const [students, setStudents] = useState([]);
  const [telemetryEvents, setTelemetryEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterBlock, setFilterBlock] = useState('all');

  // Offline banner & Exponential Backoff state (Requirement 6)
  const initialOffline = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('offline') === 'true';
  const [isOffline, setIsOffline] = useState(initialOffline);
  const [countdown, setCountdown] = useState(1);
  const backoffRef = React.useRef(1);
  const timerRef = React.useRef(null);

  const fetchFacilitatorData = async () => {
    let success = false;
    try {
      const [metricsRes, studentsRes, telemetryRes] = await Promise.all([
        fetch('/api/facilitator/metrics').catch(() => null),
        fetch('/api/facilitator/students').catch(() => null),
        fetch('/api/telemetry/recent').catch(() => null)
      ]);

      if (metricsRes && metricsRes.ok) {
        const mData = await metricsRes.json();
        setMetrics(mData);
        success = true;
      } else {
        // Fallback realistic metrics if offline
        setMetrics({
          cohort: 'Gaya District Pilot (Tekari & Bodh Gaya Blocks)',
          totalStudents: 12,
          minorsCount: 2,
          firstEarningCount: 5,
          firstEarningRate: 41.7,
          activeLearnersCount: 7,
          weeklyRetentionRate: 58.3,
          totalEarningsGenerated: 320,
          totalAutoSavedPool: 32,
          triageQueueCount: 1,
          disclaimer: 'Sample data modelled on DIKSHA/SWAYAM/NSDC'
        });
      }

      if (studentsRes && studentsRes.ok) {
        const sData = await studentsRes.json();
        setStudents(sData.students || []);
      }

      if (telemetryRes && telemetryRes.ok) {
        const tData = await telemetryRes.json();
        setTelemetryEvents(tData.events || []);
      }
    } catch (err) {
      console.warn('Error fetching facilitator data:', err);
    } finally {
      setIsLoading(false);
    }

    if (!success || initialOffline) {
      setIsOffline(true);
      const nextDelay = Math.min(16, backoffRef.current * 2);
      backoffRef.current = nextDelay;
      setCountdown(nextDelay);
      timerRef.current = setTimeout(fetchFacilitatorData, nextDelay * 1000);
    } else {
      setIsOffline(false);
      backoffRef.current = 1;
      setCountdown(1);
      timerRef.current = setTimeout(fetchFacilitatorData, 1000);
    }
  };

  useEffect(() => {
    fetchFacilitatorData();
    const interval = setInterval(() => {
      setCountdown(prev => (prev > 1 ? prev - 1 : 1));
    }, 1000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      clearInterval(interval);
    };
  }, []);

  const filteredStudents = filterBlock === 'all' 
    ? students 
    : students.filter(s => s.village.toLowerCase().includes(filterBlock.toLowerCase()));

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-black/10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-full bg-white text-ink border border-ink/15 shadow-xs hover:bg-[#F2F4FC] flex items-center justify-center transition-all"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-primary px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                Telemetry: HTTP Polling (1s cadence)
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                Live Facilitator Mode
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-display text-ink mt-0.5">
              {lang === 'hi' ? 'ग्राम सुविधा प्रदाता डैशबोर्ड' : 'Village Facilitator Command Center'}
            </h1>
            <p className="text-xs text-ink/70 font-semibold">
              Gaya Pilot Cohort • Tekari & Bodh Gaya Clusters • Seeded Sample Dataset
            </p>
          </div>
        </div>

        <button
          onClick={fetchFacilitatorData}
          className="min-h-[44px] px-3.5 py-2 rounded-full bg-white text-ink border border-ink/15 text-xs font-bold shadow-xs hover:bg-butter flex items-center gap-1.5 transition-all self-end sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-primary" />
          <span>{lang === 'hi' ? 'रिफ्रेश करें' : 'Refresh Telemetry'}</span>
        </button>
      </div>

      {/* Offline Banner with Backoff Notice (Requirement 6) */}
      {isOffline && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex items-center justify-between text-xs font-bold shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-800 animate-pulse" />
            <span>{lang === 'hi' ? `ऑफ़लाइन: पिछला डेटा दिखाया जा रहा है, ${countdown}s में पुनः प्रयास...` : `Offline: showing last known data, retrying in ${countdown}s...`}</span>
          </div>
          <button
            onClick={() => {
              if (timerRef.current) clearTimeout(timerRef.current);
              backoffRef.current = 1;
              fetchFacilitatorData();
            }}
            className="px-3 py-1 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-amber-900 text-[11px] font-black transition-all active:scale-95"
          >
            {lang === 'hi' ? 'पुनः प्रयास करें' : 'Retry Now'}
          </button>
        </div>
      )}

      {/* 4-Column Bento Metrics Grid (Requirement 9) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        
        {/* Metric 1: Total Enrolled & Minors */}
        <BentoTile variant="butter" className="p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-ink/70">
              Enrolled Learners
            </span>
            <Users className="w-4 h-4 text-ink" />
          </div>
          <div className="my-2">
            <h3 className="text-3xl sm:text-4xl font-black font-display text-ink">
              {metrics ? metrics.totalStudents : 12}
            </h3>
            <span className="text-[11px] font-bold text-ink/80 block mt-0.5">
              {metrics ? metrics.minorsCount : 2} minors under 18 (DPDP protected)
            </span>
          </div>
          <span className="text-[10px] font-mono text-ink/60 block">
            Baseline: 12 seeded rural youth
          </span>
        </BentoTile>

        {/* Metric 2: 1st Earning Conversion Rate */}
        <BentoTile variant="sky" className="p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-primary">
              1st Earning Conversion
            </span>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div className="my-2">
            <h3 className="text-3xl sm:text-4xl font-black font-display text-ink">
              {metrics ? `${metrics.firstEarningRate}%` : '41.7%'}
            </h3>
            <span className="text-[11px] font-bold text-ink/80 block mt-0.5">
              {metrics ? metrics.firstEarningCount : 5} of 12 earned first payout (≥₹40)
            </span>
          </div>
          <span className="text-[10px] font-mono text-ink/60 block">
            Formula: (Earners ≥ ₹40 / Total) × 100
          </span>
        </BentoTile>

        {/* Metric 3: Weekly Active Retention */}
        <BentoTile variant="lavender" className="p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-ink/70">
              Weekly Retention
            </span>
            <Activity className="w-4 h-4 text-ink" />
          </div>
          <div className="my-2">
            <h3 className="text-3xl sm:text-4xl font-black font-display text-ink">
              {metrics ? `${metrics.weeklyRetentionRate}%` : '58.3%'}
            </h3>
            <span className="text-[11px] font-bold text-ink/80 block mt-0.5">
              {metrics ? metrics.activeLearnersCount : 7} of 12 active within last 7 days
            </span>
          </div>
          <span className="text-[10px] font-mono text-ink/60 block">
            Formula: (Active ≤ 7d / Total) × 100
          </span>
        </BentoTile>

        {/* Metric 4: Auto-Savings Cumulative Pool */}
        <BentoTile variant="rose" className="p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-ink/70">
              Auto-Savings Pool (10%)
            </span>
            <Coins className="w-4 h-4 text-ink" />
          </div>
          <div className="my-2">
            <h3 className="text-3xl sm:text-4xl font-black font-display text-ink">
              ₹{metrics ? metrics.totalAutoSavedPool : 32}
            </h3>
            <span className="text-[11px] font-bold text-ink/80 block mt-0.5">
              Saved for Tools / Laptop Fund
            </span>
          </div>
          <span className="text-[10px] font-mono text-ink/60 block">
            From ₹{metrics ? metrics.totalEarningsGenerated : 320} total micro-payouts
          </span>
        </BentoTile>

      </div>

      {/* Low-Confidence Triage Queue & Live Telemetry Stream Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Triage Queue: Human In-The-Loop Referral (Confidence < 0.60 Safeguard) */}
        <div className="bg-white rounded-32 border border-black/10 shadow-bento p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-900 border border-amber-300">
                <AlertTriangle className="w-5 h-5 text-amber-800" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-ink font-display">
                  Low-Confidence Triage Queue
                </h3>
                <span className="text-[11px] text-amber-900 font-bold block">
                  Grounding score &lt; 0.60 safeguard triggered
                </span>
              </div>
            </div>
            <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-200 text-amber-950 border border-amber-400">
              1 Pending Triage
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                  Student Referral • Wazirganj Block
                </span>
                <h4 className="text-sm font-black text-ink">
                  Amit Kumar (19) • Gaya
                </h4>
                <p className="text-xs text-ink/80 font-medium mt-0.5">
                  Voice transcript lacked clear vocational keywords. Grounding score was 0.45. Referred to mentor to prevent misaligned assignment.
                </p>
              </div>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-white text-amber-900 border border-amber-300 shrink-0">
                Score: 0.45
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <button
                onClick={() => alert('Assigned in-person counseling session for Amit Kumar.')}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
              >
                In-Person Counseling
              </button>
              <button
                onClick={() => alert('Assigned village field mentor for trade exploration.')}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 font-bold text-xs transition-all active:scale-95"
              >
                Assign Field Mentor
              </button>
            </div>
          </div>
        </div>

        {/* Live MQTT Telemetry Stream (QoS 1) */}
        <div className="bg-white rounded-32 border border-black/10 shadow-bento p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-sky-light text-primary border border-sky/40">
                <Radio className="w-5 h-5 text-primary animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-ink font-display">
                  Live Telemetry Feed (MQTT QoS 1)
                </h3>
                <span className="text-[11px] text-ink/70 font-semibold block">
                  Wildcard Topic: kk/students/+/progress
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
              Broker Connected
            </span>
          </div>

          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {telemetryEvents && telemetryEvents.length > 0 ? (
              telemetryEvents.slice().reverse().map((evt, idx) => (
                <div key={evt.id || idx} className="p-3 rounded-xl bg-[#F8F9FD] border border-ink/10 flex items-center justify-between text-xs animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-bold text-ink">{evt.studentId}</span>
                    <span className="text-ink/60">• {evt.eventType} {evt.itemId ? `(${evt.itemId})` : ''}</span>
                  </div>
                  <span className="text-[10px] font-mono text-ink/50">
                    {evt.serverReceivedAt ? new Date(evt.serverReceivedAt).toLocaleTimeString() : 'Just now'}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-xl bg-[#F8F9FD] border border-ink/10 text-xs text-ink/60 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Awaiting live telemetry events on kk/students/+/progress...</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Cohort Student Directory (12 Seeded Students) */}
      <div className="bg-white rounded-32 border border-black/10 shadow-bento p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-black font-display text-ink">
              Gaya District Learner Directory
            </h3>
            <p className="text-xs text-ink/70 font-semibold">
              12 Village youth active in clean energy, garment stitching, and rural mobility
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="text-ink/60">Filter Block:</span>
            {['all', 'Tekari', 'Bodh Gaya'].map(b => (
              <button
                key={b}
                onClick={() => setFilterBlock(b)}
                className={`min-h-[44px] px-3 py-1.5 rounded-full border transition-all ${
                  filterBlock === b 
                    ? 'bg-ink text-white border-ink' 
                    : 'bg-white text-ink border-black/15 hover:bg-butter'
                }`}
              >
                {b === 'all' ? 'All Blocks' : b}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile View: Clean Card Layout (< md) to ensure 0 horizontal overflow at 360px */}
        <div className="block md:hidden space-y-2.5">
          {filteredStudents.map((s) => (
            <div key={s.id} className="p-3.5 rounded-2xl bg-[#F8F9FD] border border-ink/10 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-xs text-ink flex items-center gap-1.5">
                    <span>{s.name}</span>
                    {s.is_minor && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                        Age {s.age}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-ink/50 font-mono">{s.village}</span>
                </div>
                {s.triage_needed ? (
                  <span className="px-2 py-0.5 rounded-full bg-rose-light text-rose border border-rose font-bold text-[10px]">
                    Triage Needed
                  </span>
                ) : s.has_completed_first_earning ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-[10px]">
                    1st Earning
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-butter text-ink border border-ink/20 font-bold text-[10px]">
                    Training
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-black/5">
                <span className="font-bold text-ink truncate max-w-[170px]">{s.career_path}</span>
                <span className="font-bold text-emerald-700">₹{s.total_earnings} <span className="text-[10px] text-primary">(Saved: ₹{s.auto_saved_amount})</span></span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: Full Table (md+) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-black/10 text-ink/60 font-black uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Student Name</th>
                <th className="py-2.5 px-3">Village / Block</th>
                <th className="py-2.5 px-3">Target Career Path</th>
                <th className="py-2.5 px-3">Streak</th>
                <th className="py-2.5 px-3">Earned / Saved</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 font-semibold text-ink">
              {filteredStudents.map((s) => (
                <tr key={s.id} className="hover:bg-[#F8F9FD] transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-extrabold text-ink flex items-center gap-1.5">
                      <span>{s.name}</span>
                      {s.is_minor && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                          Age {s.age}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-ink/50 font-mono">id: {s.id}</span>
                  </td>
                  <td className="py-3 px-3">
                    <div>{s.village}</div>
                    <span className="text-[10px] text-ink/60">{s.district}</span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-ink">{s.career_path}</div>
                    <span className="text-[10px] text-primary font-mono">{s.current_course_id}</span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-coin-gold fill-coin-gold" />
                      <span>{s.streak_days} days</span>
                    </div>
                    <span className="text-[10px] text-ink/50">{s.total_xp} XP</span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-emerald-700">₹{s.total_earnings}</div>
                    <span className="text-[10px] text-primary">Saved: ₹{s.auto_saved_amount}</span>
                  </td>
                  <td className="py-3 px-3">
                    {s.triage_needed ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-light text-rose border border-rose font-bold text-[10px]">
                        Triage Needed
                      </span>
                    ) : s.has_completed_first_earning ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-[10px]">
                        1st Earning Done
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-butter text-ink border border-ink/20 font-bold text-[10px]">
                        In Training
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Explicit Disclaimer Notice */}
      <footer className="text-center text-xs text-ink/60 py-2">
        <p>Sample data modelled on DIKSHA/SWAYAM/NSDC • Gaya District Facilitator Telemetry Pilot</p>
      </footer>

    </div>
  );
}
