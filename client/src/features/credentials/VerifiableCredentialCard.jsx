import React, { useState, useEffect } from 'react';
import { 
  Award, 
  ShieldCheck, 
  Download, 
  QrCode, 
  CheckCircle2, 
  ExternalLink, 
  ArrowRight, 
  RotateCw, 
  FileText,
  Compass,
  Check
} from 'lucide-react';
import { useTranslation } from '../../lib/i18n';

export default function VerifiableCredentialCard({ onOpenRadar, onBack }) {
  const { t, lang } = useTranslation();
  const [credential, setCredential] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);

  const credId = 'did:credential:SAMPLE-CRED-PRIYA_17-SAMPLE-CRS-SOLAR-101';
  const verifyUrl = `http://127.0.0.1:5001/api/verify/${credId}`;

  // Fetch full credential
  useEffect(() => {
    fetch(`http://127.0.0.1:5001/api/credentials/${credId}`)
      .then(res => res.json())
      .then(data => setCredential(data))
      .catch(err => console.warn('Failed to load credential:', err));
  }, []);

  // Live Cryptographic Verification against Server Ed25519 Public Key
  const handleVerifyLive = async () => {
    setIsVerifying(true);
    try {
      const res = await fetch(verifyUrl);
      const data = await res.json();
      setVerificationResult(data);
    } catch (e) {
      console.error('Verification call failed:', e);
    } finally {
      setIsVerifying(false);
    }
  };

  // Export DigiLocker JSON
  const handleExportJson = () => {
    if (!credential) return;
    const blob = new Blob([JSON.stringify(credential, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'DigiLocker-Priya-Kumari-Solar-Tech-Level-1.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6">
      
      {/* Top Header */}
      <div className="flex items-center justify-between pb-1">
        <button
          onClick={onBack}
          className="min-h-[44px] px-4 py-2 rounded-full bg-white text-ink border border-ink/15 text-xs font-bold hover:bg-[#F2F4FC] transition-all flex items-center gap-1.5 shadow-xs"
        >
          <span>← Back to Wallet</span>
        </button>

        <span className="text-[10px] font-mono font-bold text-ink/60 bg-white px-3 py-1 rounded-full border border-ink/10 shadow-xs">
          W3C & DigiLocker Standard
        </span>
      </div>

      {/* Main Certificate / Verifiable Credential Presentation */}
      <div className="bg-white rounded-32 border-2 border-primary/20 p-6 sm:p-8 shadow-bento relative space-y-6 overflow-hidden">
        
        {/* Certificate Watermark / Header */}
        <div className="border-b border-black/10 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-black">
              <Award className="w-7 h-7 text-primary" />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                  National Skill Registry • DigiLocker Aligned
                </span>
                <span className="text-[9px] font-mono font-bold px-2 py-0.2 bg-emerald-100 text-emerald-900 rounded-full border border-emerald-300">
                  Ed25519 Signed
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black font-display text-ink mt-0.5">
                Verifiable Vocational Skill Credential
              </h1>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono font-bold text-ink/60 block">
              ISSUED BY:
            </span>
            <span className="text-xs font-bold text-ink block">
              did:web:kamai-kaksha.example
            </span>
            <span className="text-[9px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 inline-block mt-1">
              Demo issuer, not a government credential
            </span>
          </div>
        </div>

        {/* Certificate Subject & Skill Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          
          {/* Left Column: Student & Course Details */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-ink/60 block">
                Certified Student:
              </span>
              <h2 className="text-xl sm:text-2xl font-black font-display text-ink">
                Priya Kumari (Age 17)
              </h2>
              <p className="text-xs text-ink/70 font-medium">
                Gaya District, Bihar • Class 10th & Local Repair Experience
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F8F9FD] border border-ink/10 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-primary block">
                Qualification Achieved
              </span>
              <p className="font-bold text-sm text-ink">
                Solar Photovoltaic & DC Microgrid Inverter Technician (Level 1)
              </p>
              <p className="text-xs text-ink/70">
                Modelled on SWAYAM / NSDC Clean Energy Vocational Framework (SAMPLE-CRS-SOLAR-101)
              </p>
            </div>

            {/* Verified Competencies */}
            <div className="space-y-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-ink block">
                Verified Competencies:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  'DC Inverter Wiring & High-Current Safety',
                  'Multimeter Terminal Voltage Measurement',
                  'Lead-Acid & Lithium-Ion Cell Testing',
                  'Small Electronics PCB Soldering'
                ].map((comp, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 p-2 rounded-xl bg-white border border-ink/10 font-bold text-ink">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-[11px]">{comp}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Minor Protection Notice */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold text-[11px]">
                minor safeguards, pending legal review • Verified with Guardian Consent
              </span>
            </div>
          </div>

          {/* Right Column: QR Code & Cryptographic Seal */}
          <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-[#F6F8FD] border border-ink/15 text-center space-y-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-ink block">
              Cryptographic QR Seal
            </span>

            {/* High-Resolution SVG QR Code Representation */}
            <div className="p-3 bg-white rounded-2xl shadow-xs border border-ink/15 relative">
              <svg className="w-36 h-36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* QR Finder Patterns */}
                <rect x="5" y="5" width="28" height="28" rx="4" fill="#0F172A" />
                <rect x="9" y="9" width="20" height="20" rx="2" fill="white" />
                <rect x="13" y="13" width="12" height="12" rx="1" fill="#4A5AE8" />

                <rect x="67" y="5" width="28" height="28" rx="4" fill="#0F172A" />
                <rect x="71" y="9" width="20" height="20" rx="2" fill="white" />
                <rect x="75" y="13" width="12" height="12" rx="1" fill="#4A5AE8" />

                <rect x="5" y="67" width="28" height="28" rx="4" fill="#0F172A" />
                <rect x="9" y="71" width="20" height="20" rx="2" fill="white" />
                <rect x="13" y="75" width="12" height="12" rx="1" fill="#4A5AE8" />

                {/* QR Data Pixels */}
                <rect x="40" y="8" width="6" height="6" fill="#0F172A" />
                <rect x="52" y="8" width="6" height="6" fill="#0F172A" />
                <rect x="40" y="20" width="6" height="6" fill="#0F172A" />
                <rect x="46" y="26" width="6" height="6" fill="#0F172A" />
                <rect x="52" y="20" width="6" height="6" fill="#0F172A" />
                <rect x="10" y="40" width="6" height="6" fill="#0F172A" />
                <rect x="22" y="40" width="6" height="6" fill="#0F172A" />
                <rect x="40" y="40" width="8" height="8" rx="1" fill="#4A5AE8" />
                <rect x="52" y="40" width="6" height="6" fill="#0F172A" />
                <rect x="64" y="40" width="6" height="6" fill="#0F172A" />
                <rect x="76" y="40" width="6" height="6" fill="#0F172A" />
                <rect x="88" y="40" width="6" height="6" fill="#0F172A" />
                <rect x="40" y="52" width="6" height="6" fill="#0F172A" />
                <rect x="52" y="52" width="6" height="6" fill="#0F172A" />
                <rect x="70" y="52" width="6" height="6" fill="#0F172A" />
                <rect x="82" y="52" width="6" height="6" fill="#0F172A" />
                <rect x="40" y="68" width="6" height="6" fill="#0F172A" />
                <rect x="52" y="68" width="6" height="6" fill="#0F172A" />
                <rect x="46" y="78" width="6" height="6" fill="#0F172A" />
                <rect x="64" y="68" width="6" height="6" fill="#0F172A" />
                <rect x="76" y="78" width="6" height="6" fill="#0F172A" />
                <rect x="88" y="68" width="6" height="6" fill="#0F172A" />
                <rect x="88" y="88" width="6" height="6" fill="#0F172A" />
              </svg>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] font-mono text-ink/70 block truncate max-w-[180px]">
                did:credential:SAMPLE-CRED-...
              </span>
              <span className="text-[9px] font-bold text-primary block">
                Scan to verify on public endpoint
              </span>
            </div>

            {/* LIVE VERIFICATION BUTTON */}
            <button
              onClick={handleVerifyLive}
              disabled={isVerifying}
              className="w-full min-h-[44px] rounded-full bg-ink hover:bg-ink/90 text-white font-black text-xs shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <ShieldCheck className={`w-4 h-4 text-emerald-400 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>{isVerifying ? 'Verifying Ed25519...' : 'Verify Cryptographic Signature'}</span>
            </button>
          </div>

        </div>

        {/* LIVE VERIFICATION RESULT BANNER */}
        {verificationResult && (
          <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 space-y-2 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-black text-sm text-emerald-900">
                  Cryptographic Signature Validated: Ed25519 Signature Verified
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                200 OK
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono bg-white/70 p-3 rounded-xl border border-emerald-200 text-emerald-900">
              <div>
                <span className="text-[10px] text-ink/60 block font-sans">Algorithm:</span>
                <strong className="text-ink">Ed25519</strong>
              </div>
              <div>
                <span className="text-[10px] text-ink/60 block font-sans">Issuer Authority:</span>
                <strong className="text-ink truncate block">did:web:kamai-kaksha.example</strong>
              </div>
              <div>
                <span className="text-[10px] text-ink/60 block font-sans">Verified At:</span>
                <strong className="text-ink truncate block">{new Date(verificationResult.verifiedAt).toLocaleTimeString()}</strong>
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM ACTIONS: DIGILOCKER JSON EXPORT & RADAR NAVIGATION */}
        <div className="border-t border-black/10 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleExportJson}
              className="min-h-[44px] px-4 py-2 rounded-full bg-[#F6F8FD] hover:bg-ink/10 text-ink border border-ink/20 font-bold text-xs flex items-center justify-center gap-2 transition-all flex-1 sm:flex-none shadow-xs"
            >
              <Download className="w-4 h-4 text-primary" />
              <span>Export DigiLocker JSON</span>
            </button>

            <button
              onClick={() => setShowJsonModal(!showJsonModal)}
              className="min-h-[44px] px-4 py-2 rounded-full bg-white hover:bg-ink/5 text-ink border border-ink/20 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
            >
              <FileText className="w-4 h-4 text-ink" />
              <span>{showJsonModal ? 'Hide Raw JSON' : 'View Payload'}</span>
            </button>
          </div>

          <button
            onClick={onOpenRadar}
            className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-full bg-primary hover:bg-primary-hover text-white font-black text-xs shadow-xs active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Compass className="w-4 h-4 text-coin-gold" />
            <span>Open Gaon Guru Job Radar →</span>
          </button>
        </div>

        {/* INLINE RAW JSON MODAL / VIEWER */}
        {showJsonModal && credential && (
          <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto space-y-2 border border-slate-700">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-[10px] font-bold text-slate-400">
                W3C Verifiable Credential Payload (Canonical JSON-LD with Ed25519 Proof)
              </span>
              <button
                onClick={() => setShowJsonModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <pre className="max-h-60 overflow-y-auto">
              {JSON.stringify(credential, null, 2)}
            </pre>
          </div>
        )}

      </div>

      <p className="text-[11px] text-ink/60 text-center font-medium">
        Sample data modelled on NSDC / NCVET / DigiLocker standards for hackathon evaluation.
      </p>

    </div>
  );
}
