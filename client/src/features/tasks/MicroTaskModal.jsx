import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Users, 
  Camera, 
  Zap, 
  ArrowRight, 
  X,
  Coins,
  Check
} from 'lucide-react';
import { useTranslation } from '../../lib/i18n';

export default function MicroTaskModal({ isOpen, onClose, onTaskVerified, initialTaskId = 'SAMPLE-TSK-SOLAR-FIX-01' }) {
  const { t, lang } = useTranslation();
  const [task, setTask] = useState(null);
  const [voltageInput, setVoltageInput] = useState('12.6');
  const [evidenceNotes, setEvidenceNotes] = useState('Cleaned earth-pit terminal and verified DC inverter ground bus with multimeter.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rateLimitError, setRateLimitError] = useState(null);
  const [cooldownCountdown, setCooldownCountdown] = useState(0);
  const [isSimulatingPeers, setIsSimulatingPeers] = useState(false);

  // Load task details from backend
  const fetchTask = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:5001/api/tasks/${initialTaskId}`);
      if (res.ok) {
        const data = await res.json();
        setTask(data);
      }
    } catch (e) {
      console.warn('Failed to load task from server:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTask();
    }
  }, [isOpen, initialTaskId]);

  // Handle rate limit countdown
  useEffect(() => {
    if (cooldownCountdown > 0) {
      const timer = setTimeout(() => setCooldownCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (cooldownCountdown === 0) {
      setRateLimitError(null);
    }
  }, [cooldownCountdown]);

  if (!isOpen) return null;

  // Submit Evidence with Rate Limit Handling
  const handleSubmitEvidence = async () => {
    setIsSubmitting(true);
    setRateLimitError(null);

    try {
      const res = await fetch(`http://127.0.0.1:5001/api/tasks/${initialTaskId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: 'priya_17',
          guardianConsent: true,
          evidence: {
            multimeterVoltage: `${voltageInput}V`,
            notes: evidenceNotes,
            photoSimulated: 'inverter_earth_terminal_grounded.jpg'
          }
        })
      });

      const data = await res.json();

      if (res.status === 429) {
        setRateLimitError(data.error);
        setCooldownCountdown(data.retryAfterSeconds || 5);
        return;
      }

      if (res.ok && data.task) {
        setTask(data.task);
      }
    } catch (err) {
      console.error('Error submitting task evidence:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger 3-Peer Cross Validation
  const handleSimulatePeers = async () => {
    setIsSimulatingPeers(true);
    try {
      const res = await fetch(`http://127.0.0.1:5001/api/tasks/${initialTaskId}/simulate-peers`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        setTask(data.task);
      }
    } catch (e) {
      console.error('Error simulating peers:', e);
    } finally {
      setIsSimulatingPeers(false);
    }
  };

  const isPendingValidation = task?.status === 'PENDING_PEER_VALIDATION';
  const isVerifiedOrPaid = task?.status === 'VERIFIED' || task?.status === 'PAID';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-32 border border-black/10 shadow-2xl p-5 sm:p-7 space-y-4 my-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 min-h-[44px] min-w-[44px] rounded-full bg-[#F6F8FD] text-ink hover:bg-ink/10 flex items-center justify-center transition-all"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1 pr-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-wider text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
              Village Micro-Task • PM Surya Ghar
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
              Reward: ₹40 (₹4 to Tool Kit Fund)
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-black font-display text-ink leading-snug">
            {task?.title || 'Gram Panchayat Solar Inverter Grounding & Multimeter Check'}
          </h2>
          <p className="text-xs text-ink/80 font-medium">
            {task?.village || 'Tekari Block, Gaya District'} • Practical task unlocked by Module 1
          </p>
        </div>

        {/* 1. SCAM AWARENESS CARD */}
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 flex items-start gap-2.5 text-xs text-amber-950">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-black text-amber-900">
              Village Security Advisory • धोखाधड़ी से सावधान
            </p>
            <p className="font-medium text-amber-900/90 leading-relaxed text-[11px]">
              Kamai Kaksha tasks <strong>never charge registration fees</strong> or ask for OTPs or advance deposits. Always verify local task requests with your registered Village Facilitator.
            </p>
            <span className="inline-block text-[9px] font-bold text-amber-800 uppercase tracking-wider">
              Sample Security Advisory • Consumer Protection
            </span>
          </div>
        </div>

        {/* 2. MINOR CONSENT GATE CHIP */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8F9FD] border border-ink/10 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-ink">
              Minor Protection Gate: <span className="text-emerald-700">Guardian Consent Verified</span>
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-ink/60 bg-white px-2 py-0.5 rounded-full border border-ink/10">
            DPDP Under-18
          </span>
        </div>

        {/* Rate limit warning banner */}
        {rateLimitError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-900 font-bold flex items-center justify-between animate-shake">
            <span>⚠️ {rateLimitError}</span>
            <span className="px-2 py-0.5 rounded-full bg-rose-200 text-rose-950 font-mono text-[11px]">
              {cooldownCountdown}s
            </span>
          </div>
        )}

        {/* 3. TASK EXECUTION / EVIDENCE FORM */}
        {!isVerifiedOrPaid && (
          <div className="space-y-3 p-3.5 rounded-2xl bg-white border border-ink/15">
            <span className="text-xs font-black uppercase tracking-wider text-ink block">
              1. Step: Submit Practical Evidence
            </span>

            <div className="space-y-2 text-xs">
              <div>
                <label className="font-bold text-ink block mb-1">
                  Multimeter Voltage Reading (DC Ground Bus):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={voltageInput}
                    onChange={(e) => setVoltageInput(e.target.value)}
                    disabled={isPendingValidation}
                    className="w-24 px-3 py-1.5 rounded-xl border border-ink/20 font-mono font-bold text-ink focus:outline-primary"
                  />
                  <span className="text-xs font-bold text-ink/70">Volts DC (Nominal range: 12.4V - 12.8V)</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-ink block mb-1">
                  Work Notes:
                </label>
                <textarea
                  value={evidenceNotes}
                  onChange={(e) => setEvidenceNotes(e.target.value)}
                  disabled={isPendingValidation}
                  rows={2}
                  className="w-full px-3 py-1.5 rounded-xl border border-ink/20 text-xs font-medium text-ink focus:outline-primary resize-none"
                />
              </div>

              {/* Photo Evidence Simulator */}
              <div className="flex items-center gap-2 p-2 rounded-xl bg-[#F6F8FD] border border-dashed border-ink/20">
                <Camera className="w-4 h-4 text-primary" />
                <span className="text-[11px] font-bold text-ink flex-1 truncate">
                  inverter_earth_terminal_cleaned.jpg (Simulated photo attached)
                </span>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-bold">
                  Attached
                </span>
              </div>
            </div>

            {!isPendingValidation ? (
              <button
                onClick={handleSubmitEvidence}
                disabled={isSubmitting || cooldownCountdown > 0}
                className="w-full min-h-[44px] rounded-full bg-primary hover:bg-primary-hover text-white font-black text-xs shadow-xs active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                <span>{isSubmitting ? 'Submitting Evidence...' : 'Submit Evidence (Awaiting Peer Review)'}</span>
              </button>
            ) : (
              <div className="flex items-center justify-between p-2 rounded-xl bg-blue-50 text-blue-900 text-xs font-bold">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 animate-spin text-primary" />
                  Evidence submitted. Proceed to 3-peer cross validation.
                </span>
              </div>
            )}
          </div>
        )}

        {/* 4. 3-PEER CROSS VALIDATION SECTION */}
        <div className="space-y-2.5 p-3.5 rounded-2xl bg-[#F8F9FD] border border-ink/15">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-ink flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span>3-Peer Cross-Validation • Simulated peer review</span>
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {task?.validations?.filter(v => v.approved).length || 0} / 3 Approvals
            </span>
          </div>

          <div className="space-y-1.5">
            {[
              { id: 'peer_rahul_02', name: 'Rahul Kumar', block: 'Tekari (Solar Batchmate)' },
              { id: 'peer_meera_03', name: 'Meera Devi', block: 'Bodh Gaya (Certified Tech)' },
              { id: 'peer_amit_04', name: 'Amit Sharma', block: 'Gaya Hub (Senior Peer)' }
            ].map((peer, idx) => {
              const isApproved = task?.validations?.some(v => v.peerId === peer.id && v.approved);
              return (
                <div
                  key={peer.id}
                  className={`flex items-center justify-between p-2 rounded-xl text-xs border transition-all ${
                    isApproved 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950 font-bold' 
                      : 'bg-white border-black/10 text-ink'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                      isApproved ? 'bg-emerald-600 text-white' : 'bg-ink/10 text-ink'
                    }`}>
                      {isApproved ? '✓' : idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold block">{peer.name}</span>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-ink/10 text-ink/70">Simulated peer review</span>
                      </div>
                      <span className="text-[10px] opacity-70 block">{peer.block}</span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isApproved ? 'bg-emerald-200 text-emerald-900' : 'bg-ink/5 text-ink/60'
                  }`}>
                    {isApproved ? 'Verified & Approved' : 'Pending Review'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Action button to simulate peer validation */}
          {!isVerifiedOrPaid && (
            <button
              onClick={handleSimulatePeers}
              disabled={isSimulatingPeers}
              className="w-full min-h-[44px] rounded-full bg-ink hover:bg-ink/90 text-white font-black text-xs shadow-xs active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4 text-butter" />
              <span>{isSimulatingPeers ? 'Verifying with 3 Peers...' : 'Simulate 3-Peer Cross-Validation'}</span>
            </button>
          )}

          {isVerifiedOrPaid && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-black text-xs">
                  3/3 Peer Approvals Verified! Task Completed.
                </span>
              </div>
              <button
                onClick={() => {
                  onClose();
                  if (onTaskVerified) onTaskVerified(task);
                }}
                className="w-full min-h-[44px] rounded-full bg-coin-gold hover:brightness-105 text-ink font-black text-xs shadow-xs active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Coins className="w-4 h-4" />
                <span>Open Wallet & Claim ₹40 (Coin Burst)</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
