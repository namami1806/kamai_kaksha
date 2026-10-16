import React from 'react';
import MascotKamu from '../components/MascotKamu';
import { 
  ShieldCheck, 
  Database, 
  Lock, 
  Users, 
  Coins, 
  MapPin, 
  Award, 
  WifiOff, 
  ArrowLeft,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function AboutPage({ onBack, onNavigate }) {
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
          Citi Hackathon Prototype
        </span>
      </div>

      {/* Hero Card */}
      <div className="bg-white rounded-32 border border-black/10 p-6 sm:p-8 shadow-bento space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-black text-xs uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>About Kamai Kaksha • कमाई की कक्षा</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display text-ink leading-tight">
              The Earning Classroom
            </h1>
            <p className="text-xs sm:text-sm text-ink/80 font-medium max-w-xl leading-relaxed">
              Transforming rural youth's vocational competencies into real income, automated tool-kit savings, and cryptographically verifiable credit histories.
            </p>
          </div>

          <div className="shrink-0 animate-float">
            <MascotKamu state="proud" size={100} />
          </div>
        </div>
      </div>

      {/* Architecture Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          {
            icon: WifiOff,
            title: 'Offline-First Resilience',
            desc: 'Operates seamlessly with zero network via IndexedDB mutation queues that survive browser refresh and power loss.'
          },
          {
            icon: ShieldCheck,
            title: 'Minor Safeguards (Age 17)',
            desc: 'Plain-language DPDP consent with guardian step. Tasks restricted to non-hazardous domestic apprenticeships pending legal review.'
          },
          {
            icon: Users,
            title: '3-Peer Cross-Validation',
            desc: 'Decentralized peer verification prevents single-point fraud and fosters village cooperative learning batches.'
          },
          {
            icon: Coins,
            title: '10% Tool Kit Auto-Save',
            desc: 'Automated micro-savings mechanism reserving 10% of each task reward for professional tools (soldering iron, multimeter).'
          },
          {
            icon: Lock,
            title: 'Ed25519 Cryptographic Proof',
            desc: 'Server-side signed W3C Verifiable Credentials with RFC 8785 canonical tamper detection and offline QR validation.'
          },
          {
            icon: MapPin,
            title: 'Gaon Guru Job Radar',
            desc: 'Rules-based skill matching engine connecting certified learners with clean energy rooftop solar clusters around Gaya.'
          }
        ].map((feat, idx) => {
          const Icon = feat.icon;
          return (
            <div key={idx} className="bg-white rounded-24 border border-black/10 p-4 shadow-xs space-y-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Icon className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs text-ink">{feat.title}</h3>
              <p className="text-[11px] text-ink/70 font-medium leading-relaxed">{feat.desc}</p>
            </div>
          );
        })}
      </div>

      {/* WHAT'S REAL VS SIMULATED TABLE */}
      <div className="bg-white rounded-32 border border-black/10 p-5 sm:p-7 shadow-bento space-y-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-primary block">
            Hackathon Transparency Matrix
          </span>
          <h2 className="text-lg sm:text-xl font-black font-display text-ink">
            What's Real vs. Simulated
          </h2>
          <p className="text-xs text-ink/70 font-medium">
            Strict audit delineation of production-grade implementations vs. mock services for evaluation.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-black/10 bg-[#F8F9FD]">
                <th className="py-2.5 px-3 font-black text-ink">Component</th>
                <th className="py-2.5 px-3 font-black text-ink">Status</th>
                <th className="py-2.5 px-3 font-black text-ink">Implementation Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {[
                { name: 'Offline Queue', status: 'REAL', desc: 'IndexedDB persistent mutation log (idb). Survives reload, flushes on reconnect.' },
                { name: 'IndexedDB Audio', status: 'REAL', desc: 'MediaRecorder blob storage. Permanently purged after transcription.' },
                { name: 'Ed25519 Signing', status: 'REAL', desc: 'Node.js RFC 8032 crypto.sign/crypto.verify. Private key isolated on server.' },
                { name: 'Tamper Detection', status: 'REAL', desc: 'RFC 8785 recursive canonical JSON stringification; modifying any field invalidates.' },
                { name: 'MQTT ACLs', status: 'REAL', desc: 'Aedes broker on port 5001/mqtt. Student topic ACL, facilitator wildcard.' },
                { name: 'Rate Limiter', status: 'REAL', desc: '5-second cooldown per student with HTTP 429 and retry-after header.' },
                { name: 'Speech-to-Text', status: 'SIMULATED', desc: 'Rule-based keyword extraction mock engine. Labelled as demo transcript.' },
                { name: 'UPI Micro-Payout', status: 'SIMULATED', desc: 'Mock VPA (priya@okgramin). Zero real fiat currency moved.' },
                { name: '3-Peer Validation', status: 'SIMULATED', desc: 'Simulated village batchmate review network (Rahul, Meera, Amit).' },
                { name: 'Minor Consent', status: 'SIMULATED', desc: 'Interactive DPDP plain-language modal with simulated guardian phone step.' },
                { name: 'Credit Score', status: 'SIMULATED', desc: 'Illustrative 12-month linear projection modelled on SHG micro-credit data.' },
                { name: 'Job Radar Data', status: 'SIMULATED', desc: 'Modelled on PM Surya Ghar rooftop solar cluster hubs in Gaya District.' }
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-[#F6F8FD]">
                  <td className="py-2 px-3 font-bold text-ink whitespace-nowrap">{row.name}</td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      row.status === 'REAL' 
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-ink/80 text-[11px]">{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disclaimers Footer Card */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
        <p className="font-bold">Modelled Prototype Disclaimer</p>
        <p className="text-[11px] leading-relaxed text-amber-900/90 font-medium">
          All courses, apprenticeships, and jobs are sample data modelled on DIKSHA, SWAYAM, and NSDC frameworks for Citi Hackathon evaluation. The credential issuer is <code>did:web:kamai-kaksha.example</code> (Demo issuer, not a government credential).
        </p>
      </div>

    </div>
  );
}
